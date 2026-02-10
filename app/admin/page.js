'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Users,
  Briefcase,
  Building,
  MessageSquare,
  CreditCard,
  Bell,
  Settings,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  LogOut,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

// Sidebar Navigation
function AdminSidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'exams', label: 'Exams', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'mock-tests', label: 'Mock Tests', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'questions', label: 'Questions', icon: <BookOpen className="w-5 h-5" /> },
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
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-teal-700">Unishaala</span>
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

// Generic CRUD Table Component
function CRUDTable({ title, data, columns, onAdd, onEdit, onDelete, loading, addButtonLabel = 'Add New' }) {
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {onAdd && (
            <Button onClick={() => setShowAddDialog(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" /> {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-lg">
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      {columns.map((col) => (
                        <TableCell key={col.key}>
                          {col.render ? col.render(item[col.key], item) : item[col.key]}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onEdit && (
                            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// CSV Upload Component
function CSVUpload({ onUpload, sampleHeaders, title }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i]?.trim() || '';
        });
        return obj;
      });

      const uploadResult = await onUpload(data);
      setResult(uploadResult);
      toast.success(`Upload complete: ${uploadResult.success} successful, ${uploadResult.failed} failed`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
    } finally {
      setUploading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = sampleHeaders.join(',') + '\nSample Value 1,Sample Value 2,...';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(' ', '_')}_sample.csv`;
    a.click();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="w-5 h-5" /> Bulk Upload {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1"
          />
          <Button onClick={handleUpload} disabled={!file || uploading} className="bg-teal-600 hover:bg-teal-700">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload CSV
          </Button>
          <Button variant="outline" onClick={downloadSample}>
            <Download className="w-4 h-4 mr-2" /> Sample CSV
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                <p className="text-sm text-gray-500">Total Rows</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-gray-500">Successful</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                <p className="font-medium text-gray-700 mb-2">Errors:</p>
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-red-600 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span>Row {err.row}: {err.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Questions Tab with CSV Upload
function QuestionsTab({ questions, mockTests, onRefresh }) {
  const [selectedMockTest, setSelectedMockTest] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkUpload = async (data) => {
    if (!selectedMockTest) {
      toast.error('Please select a mock test first');
      return { total: 0, success: 0, failed: 0, errors: [{ row: 0, error: 'No mock test selected' }] };
    }

    const formattedQuestions = data.map(row => ({
      questionText: row.question_title || row.questionText,
      options: [row.option1_title, row.option2_title, row.option3_title, row.option4_title].filter(Boolean),
      correctOption: parseInt(row.correct_option_number || row.correctOption),
      marks: parseFloat(row.marks) || 2,
      negativeMarks: parseFloat(row.negative_marks) || 0.66,
      solution: row.solution_text || row.solution,
      topic: row.topic_title || row.topic,
      difficulty: row.difficulty || 'Medium'
    }));

    try {
      const response = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockTestId: selectedMockTest, questions: formattedQuestions })
      });
      const result = await response.json();
      if (result.success) {
        onRefresh();
        return result.data;
      }
      return { total: formattedQuestions.length, success: 0, failed: formattedQuestions.length, errors: [{ row: 0, error: result.error }] };
    } catch (error) {
      return { total: formattedQuestions.length, success: 0, failed: formattedQuestions.length, errors: [{ row: 0, error: error.message }] };
    }
  };

  const columns = [
    { key: 'questionNumber', label: '#' },
    { key: 'questionText', label: 'Question', render: (val) => <span className="line-clamp-2 max-w-md">{val}</span> },
    { key: 'topic', label: 'Topic' },
    { key: 'difficulty', label: 'Difficulty', render: (val) => <Badge variant="secondary">{val}</Badge> },
    { key: 'marks', label: 'Marks' },
  ];

  return (
    <div>
      <div className="mb-6">
        <Label>Select Mock Test for Upload</Label>
        <Select value={selectedMockTest} onValueChange={setSelectedMockTest}>
          <SelectTrigger className="w-80 mt-2">
            <SelectValue placeholder="Choose a mock test" />
          </SelectTrigger>
          <SelectContent>
            {mockTests.map((test) => (
              <SelectItem key={test.id} value={test.id}>{test.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CSVUpload
        onUpload={handleBulkUpload}
        sampleHeaders={['question_title', 'option1_title', 'option2_title', 'option3_title', 'option4_title', 'correct_option_number', 'solution_text', 'topic_title', 'difficulty']}
        title="Questions"
      />

      <CRUDTable
        title="All Questions"
        data={questions}
        columns={columns}
        loading={loading}
      />
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
    // Check if user is logged in and is admin
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
      const endpoints = {
        dashboard: '/api/admin/stats',
        exams: '/api/admin/exams',
        'mock-tests': '/api/admin/mock-tests',
        questions: '/api/admin/questions',
        jobs: '/api/admin/jobs',
        colleges: '/api/admin/colleges',
        users: '/api/admin/users',
        testimonials: '/api/admin/testimonials',
        notifications: '/api/notifications',
        contacts: '/api/admin/contacts',
        transactions: '/api/admin/transactions'
      };

      if (activeTab === 'dashboard') {
        const response = await fetch(endpoints.dashboard);
        const result = await response.json();
        if (result.success) setStats(result.data);
      } else if (activeTab === 'questions') {
        // Fetch both questions and mock tests
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
      } else {
        const endpoint = endpoints[activeTab];
        if (endpoint) {
          const response = await fetch(endpoint);
          const result = await response.json();
          if (result.success) {
            setData(prev => ({ ...prev, [activeTab.replace('-', '')]: result.data }));
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

  const examColumns = [
    { key: 'name', label: 'Name' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'category', label: 'Category', render: (val) => <Badge variant="secondary">{val}</Badge> },
    { key: 'status', label: 'Status', render: (val) => <Badge className={val === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{val}</Badge> },
  ];

  const jobColumns = [
    { key: 'title', label: 'Title' },
    { key: 'organization', label: 'Organization' },
    { key: 'vacancies', label: 'Vacancies' },
    { key: 'lastDate', label: 'Last Date' },
    { key: 'status', label: 'Status', render: (val) => <Badge className={val === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{val}</Badge> },
  ];

  const userColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (val) => <Badge>{val}</Badge> },
    { key: 'isVerified', label: 'Verified', render: (val) => val ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" /> },
  ];

  const contactColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status', render: (val) => <Badge className={val === 'New' ? 'bg-blue-500' : 'bg-gray-500'}>{val}</Badge> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="ml-64">
        {/* Header */}
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

        {/* Main Content */}
        <main className="p-8">
          {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
          
          {activeTab === 'exams' && (
            <CRUDTable
              title="Exams"
              data={data.exams || []}
              columns={examColumns}
              onDelete={(id) => handleDelete('exams', id)}
              loading={loading}
            />
          )}

          {activeTab === 'mock-tests' && (
            <CRUDTable
              title="Mock Tests"
              data={data.mocktests || data.mockTests || []}
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'duration', label: 'Duration (min)' },
                { key: 'totalQuestions', label: 'Questions' },
                { key: 'isFree', label: 'Free', render: (val) => val ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-400" /> },
                { key: 'price', label: 'Price', render: (val) => val ? `₹${val}` : 'Free' },
              ]}
              onDelete={(id) => handleDelete('mock-tests', id)}
              loading={loading}
            />
          )}

          {activeTab === 'questions' && (
            <QuestionsTab 
              questions={data.questions || []} 
              mockTests={data.mockTests || []}
              onRefresh={fetchData}
            />
          )}

          {activeTab === 'jobs' && (
            <CRUDTable
              title="Jobs"
              data={data.jobs || []}
              columns={jobColumns}
              onDelete={(id) => handleDelete('jobs', id)}
              loading={loading}
            />
          )}

          {activeTab === 'colleges' && (
            <>
              <CSVUpload
                onUpload={async (csvData) => {
                  try {
                    const response = await fetch('/api/admin/colleges/bulk', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ colleges: csvData })
                    });
                    const result = await response.json();
                    if (result.success) {
                      fetchData();
                      return result.data;
                    }
                    return { total: csvData.length, success: 0, failed: csvData.length, errors: [] };
                  } catch (error) {
                    return { total: csvData.length, success: 0, failed: csvData.length, errors: [] };
                  }
                }}
                sampleHeaders={['name', 'location', 'ranking', 'type', 'fees', 'rating']}
                title="Colleges"
              />
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
            </>
          )}

          {activeTab === 'users' && (
            <CRUDTable
              title="Users"
              data={data.users || []}
              columns={userColumns}
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
              columns={contactColumns}
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
