'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MainNavbar from '@/app/components/MainNavbar';
import { 
  Upload, FileSpreadsheet, ImageIcon, CheckCircle, XCircle, AlertTriangle, 
  Loader2, Download, Info, FileArchive 
} from 'lucide-react';

export default function ImportQuestionsPage() {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/admin/tests');
      const data = await res.json();
      if (data.success) {
        setTests(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching tests:', e);
    }
  };

  const handleImport = async () => {
    if (!selectedTest) {
      setError('Please select a test');
      return;
    }
    if (!csvFile) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('test_id', selectedTest);
      formData.append('csv_file', csvFile);
      if (zipFile) {
        formData.append('images_zip', zipFile);
      }

      const res = await fetch('/api/admin/import-questions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
        setCsvFile(null);
        setZipFile(null);
        // Reset file inputs
        const csvInput = document.getElementById('csv-input');
        const zipInput = document.getElementById('zip-input');
        if (csvInput) csvInput.value = '';
        if (zipInput) zipInput.value = '';
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (e) {
      setError(e.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = (format) => {
    let content, filename;
    
    if (format === 'old') {
      content = `test_title,topic_title,question_number,question_text,duration,description,solution_text,tip,status,option1_title,option2_title,option3_title,option4_title,correct_option_number
Sample Test,Math Basics,1,What is 2 + 2?,60,Simple addition,The answer is 4,Remember basic arithmetic,active,3,4,5,6,2
Sample Test,Math Basics,2,What is 5 x 3?,60,Multiplication,The answer is 15,Use multiplication tables,active,10,15,20,25,2`;
      filename = 'sample_questions_old_format.csv';
    } else {
      content = `test_title,topic_title,question_number,question_text,question_image,duration,description,solution_text,tip,status,option1_title,option1_image,option2_title,option2_image,option3_title,option3_image,option4_title,option4_image,correct_option_number
Sample Test,Math Basics,1,What is shown in the image?,q1.png,60,Image question,See the diagram,Look carefully,active,Triangle,opt1.png,Square,opt2.png,Circle,opt3.png,Rectangle,opt4.png,2
Sample Test,Math Basics,2,Solve this equation,q2.jpg,90,Algebra,x = 5,Isolate variable,active,x = 3,,x = 5,,x = 7,,x = 9,,2`;
      filename = 'sample_questions_new_format.csv';
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Import Questions</h1>
          <p className="text-gray-500 mt-2">Upload questions via CSV with optional images</p>
        </div>

        {/* Format Info */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Supported CSV Formats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-700">OLD Format (without images):</p>
              <code className="text-xs bg-white p-2 rounded block mt-1 overflow-x-auto">
                test_title, topic_title, question_number, question_text, duration, description, solution_text, tip, status, option1_title, option2_title, option3_title, option4_title, correct_option_number
              </code>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => downloadSampleCSV('old')}>
                <Download className="w-4 h-4 mr-2" /> Download Sample (Old)
              </Button>
            </div>
            <div>
              <p className="font-medium text-gray-700">NEW Format (with images):</p>
              <code className="text-xs bg-white p-2 rounded block mt-1 overflow-x-auto">
                test_title, topic_title, question_number, question_text, question_image, duration, ..., option1_title, option1_image, option2_title, option2_image, ..., correct_option_number
              </code>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => downloadSampleCSV('new')}>
                <Download className="w-4 h-4 mr-2" /> Download Sample (New)
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> System auto-detects format based on columns. Image filenames in CSV should match files in ZIP.
            </p>
          </CardContent>
        </Card>

        {/* Import Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Questions
            </CardTitle>
            <CardDescription>
              Select a test, upload CSV, and optionally upload images ZIP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Selection */}
            <div className="space-y-2">
              <Label>Select Test *</Label>
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a test..." />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CSV Upload */}
            <div className="space-y-2">
              <Label>CSV File *</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="csv-input"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
                {csvFile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileSpreadsheet className="w-4 h-4" />
                    {csvFile.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* ZIP Upload */}
            <div className="space-y-2">
              <Label>Images ZIP (Optional)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="zip-input"
                    type="file"
                    accept=".zip"
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
                {zipFile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileArchive className="w-4 h-4" />
                    {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Supported formats: PNG, JPG, JPEG, WEBP. Max size: 100MB
              </p>
            </div>

            {/* Import Button */}
            <Button 
              onClick={handleImport} 
              disabled={loading || !selectedTest || !csvFile}
              className="w-full bg-teal-600 hover:bg-teal-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Import Questions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="w-5 h-5" />
            <AlertTitle>Import Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && result.success && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                Import Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-gray-900">{result.total_rows}</p>
                  <p className="text-sm text-gray-500">Total Rows</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{result.imported}</p>
                  <p className="text-sm text-gray-500">Imported</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{result.updated}</p>
                  <p className="text-sm text-gray-500">Updated</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-yellow-600">{result.skipped}</p>
                  <p className="text-sm text-gray-500">Skipped</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-orange-600">{result.missing_images?.length || 0}</p>
                  <p className="text-sm text-gray-500">Missing Images</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-600">{result.invalid_rows?.length || 0}</p>
                  <p className="text-sm text-gray-500">Invalid Rows</p>
                </div>
              </div>

              {/* Missing Images */}
              {result.missing_images?.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Missing Images ({result.missing_images.length})
                  </p>
                  <div className="bg-white p-3 rounded max-h-40 overflow-y-auto text-sm">
                    {result.missing_images.map((item, i) => (
                      <div key={i} className="py-1 border-b last:border-0">
                        Row {item.row}: {item.field} - <code>{item.filename}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid Rows */}
              {result.invalid_rows?.length > 0 && (
                <div>
                  <p className="font-medium text-red-700 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Invalid Rows ({result.invalid_rows.length})
                  </p>
                  <div className="bg-white p-3 rounded max-h-40 overflow-y-auto text-sm">
                    {result.invalid_rows.map((item, i) => (
                      <div key={i} className="py-1 border-b last:border-0">
                        Row {item.row}: {item.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
