import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase, getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { parse } from 'csv-parse/sync';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

// CSV column mappings
const OLD_FORMAT_COLUMNS = [
  'test_title', 'topic_title', 'question_number', 'question_text', 'duration',
  'description', 'solution_text', 'tip', 'status', 'option1_title', 'option2_title',
  'option3_title', 'option4_title', 'correct_option_number'
];

const NEW_FORMAT_COLUMNS = [
  'test_title', 'topic_title', 'question_number', 'question_text', 'question_image',
  'duration', 'description', 'solution_text', 'tip', 'status',
  'option1_title', 'option1_image', 'option2_title', 'option2_image',
  'option3_title', 'option3_image', 'option4_title', 'option4_image',
  'correct_option_number'
];

const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request) {
  const result = {
    success: false,
    total_rows: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    missing_images: [],
    invalid_rows: [],
    error: null
  };

  try {
    // Auth check
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ ...result, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ ...result, error: 'Admin access required' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const testId = formData.get('test_id');
    const csvFile = formData.get('csv_file');
    const imagesZip = formData.get('images_zip');

    if (!testId) {
      return NextResponse.json({ ...result, error: 'Test ID is required' }, { status: 400 });
    }

    if (!csvFile) {
      return NextResponse.json({ ...result, error: 'CSV file is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Get test details
    const mockTests = await getCollection('mock_tests');
    const test = await mockTests.findOne({ id: testId });
    if (!test) {
      return NextResponse.json({ ...result, error: 'Test not found' }, { status: 404 });
    }

    // STEP 1: Parse CSV
    const csvText = await csvFile.text();
    let records;
    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });
    } catch (e) {
      return NextResponse.json({ ...result, error: `Invalid CSV format: ${e.message}` }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ ...result, error: 'CSV file is empty' }, { status: 400 });
    }

    result.total_rows = records.length;

    // Detect format by checking for image columns
    const headers = Object.keys(records[0]).map(h => h.toLowerCase().trim());
    const hasImageColumns = headers.some(h => h.includes('image'));
    console.log('CSV Format:', hasImageColumns ? 'NEW (with images)' : 'OLD (no images)');
    console.log('Headers:', headers);

    // STEP 2: Process ZIP if uploaded
    let imageMap = {};
    if (imagesZip && imagesZip.size > 0) {
      if (imagesZip.size > MAX_ZIP_SIZE) {
        return NextResponse.json({ ...result, error: 'ZIP file too large (max 100MB)' }, { status: 400 });
      }

      try {
        const zipBuffer = Buffer.from(await imagesZip.arrayBuffer());
        const zip = new AdmZip(zipBuffer);
        const entries = zip.getEntries();

        // Create temp directory for images
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'questions');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const entry of entries) {
          // Skip directories and system files
          if (entry.isDirectory) continue;
          if (entry.entryName.startsWith('__MACOSX')) continue;
          if (entry.entryName.startsWith('.')) continue;

          const fileName = path.basename(entry.entryName);
          const ext = path.extname(fileName).toLowerCase();

          // Only process allowed image formats
          if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) continue;

          // Generate unique filename
          const uniqueName = `${uuidv4()}${ext}`;
          const filePath = path.join(uploadDir, uniqueName);

          // Extract and save
          fs.writeFileSync(filePath, entry.getData());

          // Map original filename to public URL
          const publicUrl = `/uploads/questions/${uniqueName}`;
          imageMap[fileName.toLowerCase()] = publicUrl;
          
          // Also map without extension for flexibility
          const nameWithoutExt = path.basename(fileName, ext).toLowerCase();
          imageMap[nameWithoutExt] = publicUrl;
        }

        console.log('Extracted images:', Object.keys(imageMap).length);
      } catch (e) {
        console.error('ZIP processing error:', e);
        return NextResponse.json({ ...result, error: `ZIP processing failed: ${e.message}` }, { status: 400 });
      }
    }

    // STEP 3 & 4: Process records and save to DB
    const questions = await getCollection('questions');

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // +2 for 1-indexed + header row

      try {
        // Normalize column names
        const normalizedRow = {};
        for (const [key, value] of Object.entries(row)) {
          normalizedRow[key.toLowerCase().trim()] = value;
        }

        // Extract fields
        const questionNumber = parseInt(normalizedRow['question_number']);
        const questionText = normalizedRow['question_text']?.trim();
        const option1Title = normalizedRow['option1_title']?.trim();
        const option2Title = normalizedRow['option2_title']?.trim();
        const option3Title = normalizedRow['option3_title']?.trim();
        const option4Title = normalizedRow['option4_title']?.trim();
        const correctOption = parseInt(normalizedRow['correct_option_number']);

        // Validation
        const errors = [];
        if (!questionNumber || isNaN(questionNumber)) errors.push('invalid question_number');
        if (!questionText) errors.push('missing question_text');
        if (!option1Title) errors.push('missing option1_title');
        if (!option2Title) errors.push('missing option2_title');
        if (!option3Title) errors.push('missing option3_title');
        if (!option4Title) errors.push('missing option4_title');
        if (!correctOption || correctOption < 1 || correctOption > 4) errors.push('correct_option_number must be 1-4');

        if (errors.length > 0) {
          result.invalid_rows.push({ row: rowNum, errors });
          result.skipped++;
          continue;
        }

        // Process image URLs
        let questionImageUrl = null;
        let option1ImageUrl = null;
        let option2ImageUrl = null;
        let option3ImageUrl = null;
        let option4ImageUrl = null;

        if (hasImageColumns && Object.keys(imageMap).length > 0) {
          // Question image
          const qImg = normalizedRow['question_image']?.trim();
          if (qImg) {
            const mappedUrl = imageMap[qImg.toLowerCase()] || imageMap[path.basename(qImg, path.extname(qImg)).toLowerCase()];
            if (mappedUrl) {
              questionImageUrl = mappedUrl;
            } else {
              result.missing_images.push({ row: rowNum, field: 'question_image', filename: qImg });
            }
          }

          // Option images
          for (let opt = 1; opt <= 4; opt++) {
            const optImg = normalizedRow[`option${opt}_image`]?.trim();
            if (optImg) {
              const mappedUrl = imageMap[optImg.toLowerCase()] || imageMap[path.basename(optImg, path.extname(optImg)).toLowerCase()];
              if (mappedUrl) {
                if (opt === 1) option1ImageUrl = mappedUrl;
                else if (opt === 2) option2ImageUrl = mappedUrl;
                else if (opt === 3) option3ImageUrl = mappedUrl;
                else if (opt === 4) option4ImageUrl = mappedUrl;
              } else {
                result.missing_images.push({ row: rowNum, field: `option${opt}_image`, filename: optImg });
              }
            }
          }
        }

        // Build question document
        const questionDoc = {
          test_id: testId,
          test_title: normalizedRow['test_title']?.trim() || test.title,
          topic_title: normalizedRow['topic_title']?.trim() || '',
          question_number: questionNumber,
          question_text: questionText,
          question_image_url: questionImageUrl,
          duration: parseInt(normalizedRow['duration']) || 60,
          description: normalizedRow['description']?.trim() || '',
          solution_text: normalizedRow['solution_text']?.trim() || '',
          tip: normalizedRow['tip']?.trim() || '',
          status: normalizedRow['status']?.trim() || 'active',
          options: [
            { number: 1, title: option1Title, image_url: option1ImageUrl },
            { number: 2, title: option2Title, image_url: option2ImageUrl },
            { number: 3, title: option3Title, image_url: option3ImageUrl },
            { number: 4, title: option4Title, image_url: option4ImageUrl }
          ],
          correct_option_number: correctOption,
          updatedAt: new Date()
        };

        // Upsert by test_id + question_number
        const existingQuestion = await questions.findOne({ 
          test_id: testId, 
          question_number: questionNumber 
        });

        if (existingQuestion) {
          await questions.updateOne(
            { test_id: testId, question_number: questionNumber },
            { $set: questionDoc }
          );
          result.updated++;
        } else {
          await questions.insertOne({
            id: uuidv4(),
            ...questionDoc,
            createdAt: new Date()
          });
          result.imported++;
        }

      } catch (e) {
        console.error(`Error processing row ${rowNum}:`, e);
        result.invalid_rows.push({ row: rowNum, errors: [e.message] });
        result.skipped++;
      }
    }

    // Update test question count
    const totalQuestions = await questions.countDocuments({ test_id: testId });
    await mockTests.updateOne(
      { id: testId },
      { $set: { totalQuestions, updatedAt: new Date() } }
    );

    result.success = true;
    return NextResponse.json(result);

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ ...result, error: error.message }, { status: 500 });
  }
}
