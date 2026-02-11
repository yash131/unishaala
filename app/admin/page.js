'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/Logo';
import {
  LayoutDashboard,
  FileText,
  Users,
  Briefcase,
  Building,
  MessageSquare,
  CreditCard,
  Bell,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

// Sidebar Navigation
function AdminSidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'mock-tests', label: 'Mock Tests', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'questions', label: 'Questions', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'exams', label: 'Exams', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'colleges', label: 'Colleges', icon: <Building className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'testimonials', label: 'Testimonials', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'contacts', label: 'Contact Leads', icon: <FileText className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen fixed left-0 top-0 z-40">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_unishaala-web/artifacts/2nf9p203_Unishaala-logo.jpg"
            alt="Unishaala" 
            className="h-10 w-auto object-contain"
          />
          <div>
            <span className="text-lg font-bold text-teal-600">Unishaala</span>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// Dashboard Tab
function DashboardTab({ stats }) {
  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: <Users className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Exams', value: stats?.totalExams || 0, icon: <GraduationCap className="w-6 h-6" />, color: 'bg-teal-100 text-teal-600' },
    { label: 'Mock Tests', value: stats?.totalMockTests || 0, icon: <ClipboardList className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },
    { label: 'Questions', value: stats?.totalQuestions || 0, icon: <BookOpen className="w-6 h-6" />, color: 'bg-orange-100 text-orange-600' },
    { label: 'Total Jobs', value: stats?.totalJobs || 0, icon: <Briefcase className="w-6 h-6" />, color: 'bg-green-100 text-green-600' },
    { label: 'Revenue', value: `₹${stats?.totalRevenue || 0}`, icon: <CreditCard className="w-6 h-6" />, color: 'bg-rose-100 text-rose-600' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Mock Tests Management Tab
function MockTestsTab({ mockTests, onRefresh }) {
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    totalQuestions: 0,
    totalMarks: 0,
    isFree: true,
    price: 0,
    status: 'Active'
  });

  const filteredTests = mockTests.filter(test =>
    test.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = async (isEdit = false) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/mock-tests/${selectedTest.id}` : '/api/admin/mock-tests';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        toast.success(isEdit ? 'Mock test updated!' : 'Mock test created!');
        setShowAddDialog(false);
        setShowEditDialog(false);
        setFormData({ title: '', description: '', duration: 60, totalQuestions: 0, totalMarks: 0, isFree: true, price: 0, status: 'Active' });
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save mock test');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this mock test?')) return;
    try {
      const response = await fetch(`/api/admin/mock-tests/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Mock test deleted');
        onRefresh();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (test) => {
    setSelectedTest(test);
    setFormData({
      title: test.title,
      description: test.description || '',
      duration: test.duration,
      totalQuestions: test.totalQuestions || 0,
      totalMarks: test.totalMarks || 0,
      isFree: test.isFree ?? true,
      price: test.price || 0,
      status: test.status || 'Active'
    });
    setShowEditDialog(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mock Tests Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tests..."
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" /> Add Mock Test
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.title}</TableCell>
                  <TableCell>{test.duration} min</TableCell>
                  <TableCell>{test.totalQuestions || 0}</TableCell>
                  <TableCell>
                    <Badge className={test.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>
                      {test.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{test.isFree ? 'Free' : `₹${test.price}`}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/questions?testId=${test.id}&testTitle=${encodeURIComponent(test.title)}`}>
                        <Button variant="outline" size="sm" className="text-teal-600 border-teal-600">
                          <Settings className="w-4 h-4 mr-1" /> Manage Questions
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(test)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(test.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedTests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No mock tests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTests.length)} of {filteredTests.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => { setShowAddDialog(false); setShowEditDialog(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? 'Edit Mock Test' : 'Add New Mock Test'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter test title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes) *</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isFree}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked, price: checked ? 0 : formData.price })}
                />
                <Label>Free Test</Label>
              </div>
              {!formData.isFree && (
                <div className="flex-1">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setShowEditDialog(false); }}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(showEditDialog)} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (showEditDialog ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Enhanced Questions Tab with CSV Upload
function QuestionsTab({ questions, mockTests, topics, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filterTest, setFilterTest] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    test_title: '',
    topic_title: '',
    question_title: '',
    duration: 2,
    description: '',
    solution_text: '',
    tip: '',
    status: 'Active',
    option1_title: '',
    option2_title: '',
    option3_title: '',
    option4_title: '',
    correct_option_number: 1
  });

  // Get unique topics from questions
  const uniqueTopics = [...new Set(questions.map(q => q.topic_title).filter(Boolean))];

  const filteredQuestions = questions.filter(q => {
    const matchSearch = q.question_title?.toLowerCase().includes(search.toLowerCase()) ||
                       q.test_title?.toLowerCase().includes(search.toLowerCase());
    const matchTest = filterTest === 'all' || q.test_title === filterTest;
    const matchTopic = filterTopic === 'all' || q.topic_title === filterTopic;
    return matchSearch && matchTest && matchTopic;
  });

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Sample Headers
  const csvHeaders = ['test_title', 'topic_title', 'question_title', 'duration', 'description', 'solution_text', 'tip', 'status', 'option1_title', 'option2_title', 'option3_title', 'option4_title', 'correct_option_number'];

  const downloadSampleCSV = () => {
    const sampleData = [
      csvHeaders.join(','),
      'GATE CS Mock Test,Data Structures,What is the time complexity of binary search?,2,"Binary search algorithm question","Binary search divides search space in half each iteration, hence O(log n)","Remember: divide and conquer",Active,O(n),O(log n),O(n²),O(1),2'
    ].join('\n');
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const dataToExport = filterTest === 'all' ? questions : questions.filter(q => q.test_title === filterTest);
    
    const csvContent = [
      csvHeaders.join(','),
      ...dataToExport.map(q => [
        `"${q.test_title || ''}"`,
        `"${q.topic_title || ''}"`,
        `"${(q.question_title || '').replace(/"/g, '""')}"`,
        q.duration || 2,
        `"${(q.description || '').replace(/"/g, '""')}"`,
        `"${(q.solution_text || '').replace(/"/g, '""')}"`,
        `"${(q.tip || '').replace(/"/g, '""')}"`,
        q.status || 'Active',
        `"${q.option1_title || ''}"`,
        `"${q.option2_title || ''}"`,
        `"${q.option3_title || ''}"`,
        `"${q.option4_title || ''}"`,
        q.correct_option_number || 1
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file is empty or invalid');
        setUploading(false);
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
      
      // Validate headers
      const requiredHeaders = ['test_title', 'question_title', 'option1_title', 'option2_title', 'option3_title', 'option4_title', 'correct_option_number'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
        setUploading(false);
        return;
      }

      // Parse CSV rows (handle quoted fields)
      const parseCSVRow = (row) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const questionsData = lines.slice(1).map((line, index) => {
        const values = parseCSVRow(line);
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i]?.replace(/^"|"$/g, '') || '';
        });
        obj.rowNumber = index + 2;
        return obj;
      });

      // Send to API
      const response = await fetch('/api/admin/questions/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsData })
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadResult(result.data);
        toast.success(`Upload complete: ${result.data.inserted} inserted, ${result.data.failed} failed`);
        onRefresh();
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (isEdit = false) => {
    // Validation
    if (!formData.test_title || !formData.question_title || !formData.option1_title || !formData.option2_title || !formData.option3_title || !formData.option4_title) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.correct_option_number < 1 || formData.correct_option_number > 4) {
      toast.error('Correct option must be between 1 and 4');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/questions/${selectedQuestion.id}` : '/api/admin/questions/create';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        toast.success(isEdit ? 'Question updated!' : 'Question created!');
        setShowAddDialog(false);
        setShowEditDialog(false);
        resetForm();
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const response = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Question deleted');
        onRefresh();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (question) => {
    setSelectedQuestion(question);
    setFormData({
      test_title: question.test_title || '',
      topic_title: question.topic_title || '',
      question_title: question.question_title || '',
      duration: question.duration || 2,
      description: question.description || '',
      solution_text: question.solution_text || '',
      tip: question.tip || '',
      status: question.status || 'Active',
      option1_title: question.option1_title || '',
      option2_title: question.option2_title || '',
      option3_title: question.option3_title || '',
      option4_title: question.option4_title || '',
      correct_option_number: question.correct_option_number || 1
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      test_title: '',
      topic_title: '',
      question_title: '',
      duration: 2,
      description: '',
      solution_text: '',
      tip: '',
      status: 'Active',
      option1_title: '',
      option2_title: '',
      option3_title: '',
      option4_title: '',
      correct_option_number: 1
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Questions Management</h2>
        <Button onClick={() => setShowAddDialog(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" /> Add Question
        </Button>
      </div>

      {/* CSV Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" /> CSV Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            <Button variant="outline" onClick={downloadSampleCSV}>
              <Download className="w-4 h-4 mr-2" /> Download Sample CSV
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 mt-4 text-teal-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing CSV...</span>
            </div>
          )}

          {uploadResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3">Upload Summary</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gray-900">{uploadResult.total}</p>
                  <p className="text-sm text-gray-500">Total Rows</p>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{uploadResult.inserted}</p>
                  <p className="text-sm text-gray-500">Inserted</p>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </div>
              </div>

              {uploadResult.errors?.length > 0 && (
                <div className="max-h-48 overflow-y-auto">
                  <p className="font-medium text-gray-700 mb-2">Errors:</p>
                  {uploadResult.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-600 mb-1 bg-red-50 p-2 rounded">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Row {err.row}: {err.error}</span>
                    </div>
                  ))}
                </div>
              )}

              {uploadResult.testsCreated > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  {uploadResult.testsCreated} new test(s) auto-created
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search questions..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterTest} onValueChange={setFilterTest}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Test" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tests</SelectItem>
            {mockTests.map((test) => (
              <SelectItem key={test.id} value={test.title}>{test.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTopic} onValueChange={setFilterTopic}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {uniqueTopics.map((topic) => (
              <SelectItem key={topic} value={topic}>{topic}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Questions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedQuestions.map((q, index) => (
                <TableRow key={q.id}>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-sm">{q.question_title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{q.test_title}</Badge>
                  </TableCell>
                  <TableCell>{q.topic_title || '-'}</TableCell>
                  <TableCell>
                    <Badge className={q.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedQuestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No questions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQuestions.length)} of {filteredQuestions.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Question Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => { setShowAddDialog(false); setShowEditDialog(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? 'Edit Question' : 'Add New Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test Title *</Label>
                <Input
                  value={formData.test_title}
                  onChange={(e) => setFormData({ ...formData, test_title: e.target.value })}
                  placeholder="e.g., GATE CS Mock Test"
                  list="test-titles"
                />
                <datalist id="test-titles">
                  {mockTests.map(t => <option key={t.id} value={t.title} />)}
                </datalist>
              </div>
              <div>
                <Label>Topic Title</Label>
                <Input
                  value={formData.topic_title}
                  onChange={(e) => setFormData({ ...formData, topic_title: e.target.value })}
                  placeholder="e.g., Data Structures"
                  list="topic-titles"
                />
                <datalist id="topic-titles">
                  {uniqueTopics.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
            </div>

            <div>
              <Label>Question *</Label>
              <Textarea
                value={formData.question_title}
                onChange={(e) => setFormData({ ...formData, question_title: e.target.value })}
                placeholder="Enter the question"
                rows={3}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional context or description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Option 1 *</Label>
                <Input
                  value={formData.option1_title}
                  onChange={(e) => setFormData({ ...formData, option1_title: e.target.value })}
                />
              </div>
              <div>
                <Label>Option 2 *</Label>
                <Input
                  value={formData.option2_title}
                  onChange={(e) => setFormData({ ...formData, option2_title: e.target.value })}
                />
              </div>
              <div>
                <Label>Option 3 *</Label>
                <Input
                  value={formData.option3_title}
                  onChange={(e) => setFormData({ ...formData, option3_title: e.target.value })}
                />
              </div>
              <div>
                <Label>Option 4 *</Label>
                <Input
                  value={formData.option4_title}
                  onChange={(e) => setFormData({ ...formData, option4_title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Correct Option (1-4) *</Label>
                <Select 
                  value={formData.correct_option_number.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, correct_option_number: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                    <SelectItem value="3">Option 3</SelectItem>
                    <SelectItem value="4">Option 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 2 })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Solution</Label>
              <Textarea
                value={formData.solution_text}
                onChange={(e) => setFormData({ ...formData, solution_text: e.target.value })}
                placeholder="Explain the solution"
                rows={3}
              />
            </div>

            <div>
              <Label>Tip</Label>
              <Input
                value={formData.tip}
                onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                placeholder="Any helpful tip for the student"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setShowEditDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(showEditDialog)} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (showEditDialog ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Generic CRUD Table Component
function CRUDTable({ title, data, columns, onDelete, loading }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-10 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                  {onDelete && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      {columns.map((col) => (
                        <TableCell key={col.key}>
                          {col.render ? col.render(item[col.key], item) : item[col.key]}
                        </TableCell>
                      ))}
                      {onDelete && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length + (onDelete ? 1 : 0)} className="text-center py-8 text-gray-500">
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Admin Page Component
export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({
    exams: [],
    mockTests: [],
    questions: [],
    jobs: [],
    colleges: [],
    users: [],
    testimonials: [],
    notifications: [],
    contacts: [],
    transactions: []
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(userData.role)) {
        setUser(userData);
      } else {
        router.push('/');
      }
    } else {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const response = await fetch('/api/admin/stats');
        const result = await response.json();
        if (result.success) setStats(result.data);
      } else if (activeTab === 'questions') {
        const [qRes, mtRes] = await Promise.all([
          fetch('/api/admin/questions'),
          fetch('/api/admin/mock-tests')
        ]);
        const [qData, mtData] = await Promise.all([qRes.json(), mtRes.json()]);
        setData(prev => ({
          ...prev,
          questions: qData.success ? qData.data : [],
          mockTests: mtData.success ? mtData.data : []
        }));
      } else if (activeTab === 'mock-tests') {
        const response = await fetch('/api/admin/mock-tests');
        const result = await response.json();
        if (result.success) setData(prev => ({ ...prev, mockTests: result.data }));
      } else {
        const endpoints = {
          exams: '/api/admin/exams',
          jobs: '/api/admin/jobs',
          colleges: '/api/admin/colleges',
          users: '/api/admin/users',
          testimonials: '/api/admin/testimonials',
          notifications: '/api/notifications',
          contacts: '/api/admin/contacts',
          transactions: '/api/admin/transactions'
        };
        const endpoint = endpoints[activeTab];
        if (endpoint) {
          const response = await fetch(endpoint);
          const result = await response.json();
          if (result.success) {
            setData(prev => ({ ...prev, [activeTab]: result.data }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleDelete = async (collection, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`/api/admin/${collection}/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        toast.success('Item deleted successfully');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-xl font-semibold text-gray-900 capitalize">{activeTab.replace('-', ' ')}</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {user.name}</span>
              <Badge>{user.role}</Badge>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8">
          {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
          
          {activeTab === 'mock-tests' && (
            <MockTestsTab mockTests={data.mockTests || []} onRefresh={fetchData} />
          )}

          {activeTab === 'questions' && (
            <QuestionsTab 
              questions={data.questions || []} 
              mockTests={data.mockTests || []}
              topics={[]}
              onRefresh={fetchData}
            />
          )}

          {activeTab === 'exams' && (
            <CRUDTable
              title="Exams"
              data={data.exams || []}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'fullName', label: 'Full Name' },
                { key: 'category', label: 'Category', render: (val) => <Badge variant="secondary">{val}</Badge> },
                { key: 'status', label: 'Status', render: (val) => <Badge className={val === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{val}</Badge> },
              ]}
              onDelete={(id) => handleDelete('exams', id)}
              loading={loading}
            />
          )}

          {activeTab === 'jobs' && (
            <CRUDTable
              title="Jobs"
              data={data.jobs || []}
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'organization', label: 'Organization' },
                { key: 'vacancies', label: 'Vacancies' },
                { key: 'lastDate', label: 'Last Date' },
                { key: 'status', label: 'Status', render: (val) => <Badge className={val === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{val}</Badge> },
              ]}
              onDelete={(id) => handleDelete('jobs', id)}
              loading={loading}
            />
          )}

          {activeTab === 'colleges' && (
            <CRUDTable
              title="Colleges"
              data={data.colleges || []}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'location', label: 'Location' },
                { key: 'ranking', label: 'Rank' },
                { key: 'type', label: 'Type' },
                { key: 'rating', label: 'Rating' },
              ]}
              onDelete={(id) => handleDelete('colleges', id)}
              loading={loading}
            />
          )}

          {activeTab === 'users' && (
            <CRUDTable
              title="Users"
              data={data.users || []}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role', render: (val) => <Badge>{val}</Badge> },
                { key: 'isVerified', label: 'Verified', render: (val) => val ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" /> },
              ]}
              loading={loading}
            />
          )}

          {activeTab === 'testimonials' && (
            <CRUDTable
              title="Testimonials"
              data={data.testimonials || []}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'exam', label: 'Exam' },
                { key: 'rank', label: 'Rank' },
                { key: 'rating', label: 'Rating' },
              ]}
              onDelete={(id) => handleDelete('testimonials', id)}
              loading={loading}
            />
          )}

          {activeTab === 'notifications' && (
            <CRUDTable
              title="Exam Notifications"
              data={data.notifications || []}
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'examName', label: 'Exam' },
                { key: 'date', label: 'Date' },
                { key: 'isNew', label: 'New', render: (val) => val ? <Badge className="bg-rose-500">NEW</Badge> : null },
              ]}
              loading={loading}
            />
          )}

          {activeTab === 'contacts' && (
            <CRUDTable
              title="Contact Leads"
              data={data.contacts || []}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'subject', label: 'Subject' },
                { key: 'status', label: 'Status', render: (val) => <Badge className={val === 'New' ? 'bg-blue-500' : 'bg-gray-500'}>{val}</Badge> },
              ]}
              loading={loading}
            />
          )}

          {activeTab === 'transactions' && (
            <CRUDTable
              title="Transactions"
              data={data.transactions || []}
              columns={[
                { key: 'orderId', label: 'Order ID' },
                { key: 'amount', label: 'Amount', render: (val) => `₹${val}` },
                { key: 'status', label: 'Status', render: (val) => <Badge className={val === 'SUCCESS' ? 'bg-green-500' : 'bg-yellow-500'}>{val}</Badge> },
              ]}
              loading={loading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
