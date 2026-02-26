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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
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
  BookOpen,
  ClipboardList,
  Eye,
  EyeOff,
  Save,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  AlertTriangle,
  History,
  IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';

// Test Types constant
const TEST_TYPES = [
  { value: 'mock_test', label: 'Mock Test', icon: '📝' },
  { value: 'practice_questions', label: 'Practice Questions', icon: '📚' },
  { value: 'previous_year', label: 'Previous Year Questions', icon: '📜' }
];

// Sidebar
function AdminSidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'exams', label: 'Exams', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'tests', label: 'Tests', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'questions', label: 'Questions', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'colleges', label: 'Colleges', icon: <Building className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'testimonials', label: 'Testimonials', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'contacts', label: 'Contact Leads', icon: <FileText className="w-5 h-5" /> },
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

// Dashboard
function DashboardTab({ stats }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { label: 'Users', value: stats?.totalUsers || 0, icon: <Users className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600' },
          { label: 'Exams', value: stats?.totalExams || 0, icon: <GraduationCap className="w-6 h-6" />, color: 'bg-teal-100 text-teal-600' },
          { label: 'Mock Tests', value: stats?.totalMockTests || 0, icon: <ClipboardList className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },
          { label: 'Questions', value: stats?.totalQuestions || 0, icon: <BookOpen className="w-6 h-6" />, color: 'bg-orange-100 text-orange-600' },
          { label: 'Jobs', value: stats?.totalJobs || 0, icon: <Briefcase className="w-6 h-6" />, color: 'bg-green-100 text-green-600' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Exams Management Tab with full CRUD
function ExamsTab({ exams, onRefresh }) {
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', fullName: '', description: '', category: 'Engineering', icon: '📚', price: 0, status: 'Active'
  });

  const categories = ['Engineering', 'Medical', 'Management', 'Civil Services', 'Banking', 'Teaching', 'Others'];
  const icons = ['📚', '🎓', '💼', '🏛️', '🏦', '📖', '⚙️', '💻', '🔬', '📊', '🧪', '🏥'];

  const filteredExams = exams.filter(e => 
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.name || !formData.fullName) {
      toast.error('Name and Full Name are required');
      return;
    }
    setLoading(true);
    try {
      const url = editingExam ? `/api/admin/exams/${editingExam.id}` : '/api/admin/exams';
      const method = editingExam ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success(editingExam ? 'Exam updated!' : 'Exam created!');
        setShowAddDialog(false);
        setEditingExam(null);
        setFormData({ name: '', fullName: '', description: '', category: 'Engineering', icon: '📚', price: 0, status: 'Active' });
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error('Failed to save');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam? This will NOT delete associated tests.')) return;
    try {
      await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
      toast.success('Exam deleted');
      onRefresh();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const openEditDialog = (exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name || '',
      fullName: exam.fullName || '',
      description: exam.description || '',
      category: exam.category || 'Engineering',
      icon: exam.icon || '📚',
      price: exam.price || 0,
      status: exam.status || 'Active'
    });
    setShowAddDialog(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Exams Management</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search exams..." className="pl-10 w-64" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setEditingExam(null); setFormData({ name: '', fullName: '', description: '', category: 'Engineering', icon: '📚', price: 0, status: 'Active' }); setShowAddDialog(true); }} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" /> Add Exam
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Exam Pricing:</strong> Set a price for each exam. When users purchase an exam, they get full access to all tests (Mock Tests, Practice Questions, Previous Year Questions) under that exam.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExams.map(exam => (
              <TableRow key={exam.id}>
                <TableCell className="text-2xl">{exam.icon}</TableCell>
                <TableCell className="font-medium">{exam.name}</TableCell>
                <TableCell className="text-gray-600">{exam.fullName}</TableCell>
                <TableCell><Badge variant="outline">{exam.category}</Badge></TableCell>
                <TableCell>
                  {exam.price > 0 ? (
                    <span className="font-semibold text-green-600">₹{exam.price}</span>
                  ) : (
                    <span className="text-gray-400">Free</span>
                  )}
                </TableCell>
                <TableCell><Badge className={exam.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{exam.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(exam)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(exam.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredExams.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No exams found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingExam ? 'Edit' : 'Add'} Exam</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={v => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger>
                    <SelectValue>{formData.icon}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {icons.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label>Short Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., GATE, CAT, UPSC" />
              </div>
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g., Graduate Aptitude Test in Engineering" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description about this exam" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Exam Price (₹)
              </Label>
              <Input 
                type="number" 
                value={formData.price} 
                onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} 
                placeholder="0 for free access"
              />
              <p className="text-xs text-gray-500 mt-1">Users who purchase this exam get access to all tests under it</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tests Tab (replaces Mock Tests Tab) - with Test Type selection
function TestsTab({ mockTests, exams, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filterExamId, setFilterExamId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', duration: 60, isFree: true, price: 0, status: 'Active', examId: '', testType: 'mock_test'
  });

  const filteredTests = mockTests.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchesExam = !filterExamId || t.examId === filterExamId;
    const matchesType = !filterType || t.testType === filterType;
    return matchesSearch && matchesExam && matchesType;
  });

  const getExamName = (examId) => {
    const exam = exams?.find(e => e.id === examId);
    return exam ? exam.name : '-';
  };

  const getTestTypeLabel = (type) => {
    const found = TEST_TYPES.find(t => t.value === type);
    return found ? found.label : 'Mock Test';
  };

  const getTestTypeIcon = (type) => {
    const found = TEST_TYPES.find(t => t.value === type);
    return found ? found.icon : '📝';
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    if (!formData.examId && !editingTest) {
      toast.error('Please select an exam');
      return;
    }
    if (!formData.testType) {
      toast.error('Please select a test type');
      return;
    }
    setLoading(true);
    try {
      const url = editingTest ? `/api/admin/mock-tests/${editingTest.id}` : '/api/admin/mock-tests';
      const method = editingTest ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success(editingTest ? 'Test updated!' : 'Test created!');
        setShowAddDialog(false);
        setEditingTest(null);
        setFormData({ title: '', description: '', duration: 60, isFree: true, price: 0, status: 'Active', examId: '', testType: 'mock_test' });
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error('Failed to save');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this test and all its questions?')) return;
    try {
      await fetch(`/api/admin/mock-tests/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      onRefresh();
    } catch (e) {
      toast.error('Failed');
    }
  };

  const togglePublish = async (test) => {
    try {
      await fetch('/api/admin/mock-tests/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ testId: test.id, isPublished: !test.isPublished })
      });
      toast.success(test.isPublished ? 'Unpublished' : 'Published');
      onRefresh();
    } catch (e) {
      toast.error('Failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tests Management</h2>
        <div className="flex gap-4 flex-wrap">
          {/* Filter by Exam */}
          <Select value={filterExamId || "all"} onValueChange={(v) => setFilterExamId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Exams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {exams?.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.icon} {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Filter by Type */}
          <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TEST_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search..." className="pl-10 w-48" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setEditingTest(null); setFormData({ title: '', description: '', duration: 60, isFree: true, price: 0, status: 'Active', examId: '', testType: 'mock_test' }); setShowAddDialog(true); }} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" /> Add Test
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTests.map(test => (
              <TableRow key={test.id}>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <span>{getTestTypeIcon(test.testType)}</span>
                    <span className="text-xs text-gray-500">{getTestTypeLabel(test.testType)}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getExamName(test.examId)}</Badge>
                </TableCell>
                <TableCell className="font-medium">{test.title}</TableCell>
                <TableCell>{test.duration} min</TableCell>
                <TableCell>{test.questionCount || test.totalQuestions || 0}</TableCell>
                <TableCell><Badge className={test.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{test.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => togglePublish(test)} title={test.isPublished ? 'Click to Unpublish' : 'Click to Publish'}>
                    {test.isPublished ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingTest(test); setFormData({ title: test.title, description: test.description || '', duration: test.duration, isFree: test.isFree ?? true, price: test.price || 0, status: test.status, examId: test.examId || '', testType: test.testType || 'mock_test' }); setShowAddDialog(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(test.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredTests.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No tests found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTest ? 'Edit' : 'Add'} Test</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {/* Exam Selection */}
            <div>
              <Label>Exam *</Label>
              <Select value={formData.examId} onValueChange={v => setFormData({ ...formData, examId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam (GATE, CAT, UPSC...)" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.icon} {e.name} - {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Test Type Selection */}
            <div>
              <Label>Test Type *</Label>
              <Select value={formData.testType} onValueChange={v => setFormData({ ...formData, testType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Test Type" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">All test types have same behavior: timed, answers shown after submission</p>
            </div>
            <div>
              <Label>Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., GATE CS Full Mock Test 1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the test" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Switch checked={formData.isFree} onCheckedChange={c => setFormData({ ...formData, isFree: c })} />
              <Label>Free Test</Label>
              {!formData.isFree && <Input type="number" placeholder="Price (₹)" className="w-32" value={formData.price} onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })} />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Questions Tab with Exam -> Test Type -> Test -> CSV flow
function QuestionsTab({ mockTests, exams, onRefresh }) {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // CSV Preview State
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);
  
  // CSV Format Detection State
  const [csvFormat, setCsvFormat] = useState(null); // 'old' | 'new' | null
  const [hasImageColumns, setHasImageColumns] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState([]);
  const [zipFile, setZipFile] = useState(null);
  const [csvFileSelected, setCsvFileSelected] = useState(null);

  // Bulk Delete State
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter mock tests by selected exam and test type
  const filteredMockTests = mockTests.filter(t => {
    const matchesExam = !selectedExamId || t.examId === selectedExamId;
    const matchesType = !selectedTestType || t.testType === selectedTestType;
    return matchesExam && matchesType;
  });

  // Reset subsequent selections when parent changes
  useEffect(() => {
    setSelectedTestType('');
    setSelectedTestId('');
    setQuestions([]);
    setPreviewData([]);
    setShowPreview(false);
    setSelectedQuestions([]);
  }, [selectedExamId]);

  useEffect(() => {
    setSelectedTestId('');
    setQuestions([]);
    setPreviewData([]);
    setShowPreview(false);
    setSelectedQuestions([]);
    setCsvFormat(null);
    setHasImageColumns(false);
    setDetectedColumns([]);
    setZipFile(null);
    setCsvFileSelected(null);
  }, [selectedTestType]);

  // Fetch questions when test is selected
  useEffect(() => {
    if (selectedTestId) {
      fetchQuestions();
    } else {
      setQuestions([]);
    }
    setSelectedQuestions([]);
  }, [selectedTestId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questions?mockTestId=${selectedTestId}`);
      const data = await res.json();
      if (data.success) setQuestions(data.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const selectedTest = mockTests.find(t => t.id === selectedTestId);
  const selectedTypeInfo = TEST_TYPES.find(t => t.value === selectedTestType);

  // Filter questions by search
  const filteredQuestions = questions.filter(q => 
    q.question_title?.toLowerCase().includes(search.toLowerCase()) ||
    q.topic_title?.toLowerCase().includes(search.toLowerCase())
  );

  // Bulk delete functions
  const toggleSelectQuestion = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedQuestions.length} questions?`)) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/questions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          questionIds: selectedQuestions,
          mockTestId: selectedTestId
        })
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success(`Deleted ${result.deletedCount} questions`);
        setSelectedQuestions([]);
        fetchQuestions();
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error('Failed to delete questions');
    }
    setIsDeleting(false);
  };

  // CSV Headers
  const csvHeaders = ['test_title', 'topic_title', 'question_title', 'duration', 'description', 'solution_text', 'tip', 'status', 'option1_title', 'option2_title', 'option3_title', 'option4_title', 'correct_option_number'];

  const downloadSampleCSV = () => {
    const sample = [
      csvHeaders.join('\t'),
      `${selectedTest?.title || 'Test Name'}\tData Structures\tWhat is the time complexity of binary search?\t2\tDescription here\tO(log n) because it divides space in half\tRemember divide and conquer\tActive\tO(n)\tO(log n)\tO(n²)\tO(1)\t2`
    ].join('\n');
    
    const blob = new Blob([sample], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'questions_sample.csv';
    a.click();
  };

  const exportCSV = () => {
    const content = [
      csvHeaders.join('\t'),
      ...questions.map(q => [
        q.test_title || '', q.topic_title || '', q.question_title || '', q.duration || 2,
        q.description || '', q.solution_text || '', q.tip || '', q.status || 'Active',
        q.option1_title || '', q.option2_title || '', q.option3_title || '', q.option4_title || '',
        q.correct_option_number || 1
      ].join('\t'))
    ].join('\n');
    
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `questions_${selectedTest?.title || 'export'}.csv`;
    a.click();
  };

  // Handle CSV file selection and detect format
  const handleCsvSelect = async (e) => {
    const file = e.target.files?.[0];
    setCsvFileSelected(file);
    setCsvFormat(null);
    setHasImageColumns(false);
    setDetectedColumns([]);
    setZipFile(null);
    if (zipInputRef.current) zipInputRef.current.value = '';
    
    if (!file) return;
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      
      if (lines.length < 1) return;
      
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';
      const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      setDetectedColumns(headers);
      
      // Check for image columns
      const imageColumns = ['question_image', 'option1_image', 'option2_image', 'option3_image', 'option4_image'];
      const foundImageColumns = headers.filter(h => imageColumns.includes(h) || h.includes('image'));
      
      if (foundImageColumns.length > 0) {
        setCsvFormat('new');
        setHasImageColumns(true);
        toast.info(`Detected NEW format with ${foundImageColumns.length} image columns. You can upload a ZIP file with images.`);
      } else {
        setCsvFormat('old');
        setHasImageColumns(false);
      }
    } catch (err) {
      console.error('Error detecting CSV format:', err);
    }
  };

  // Parse CSV and show preview
  const handleFileUpload = async () => {
    const file = csvFileSelected;
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }
    
    if (!selectedTestId) {
      toast.error('Please select a test first');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      
      if (lines.length < 2) {
        toast.error('CSV is empty');
        return;
      }

      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';
      const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));

      const required = ['question_title', 'option1_title', 'option2_title', 'option3_title', 'option4_title', 'correct_option_number'];
      const missing = required.filter(r => !headers.includes(r));
      
      if (missing.length > 0) {
        toast.error(`Missing columns: ${missing.join(', ')}`);
        return;
      }

      const parseRow = (row) => {
        if (delimiter === '\t') return row.split('\t').map(v => v.trim().replace(/^"|"$/g, ''));
        const result = [];
        let current = '', inQuotes = false;
        for (const char of row) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
          else current += char;
        }
        result.push(current.trim());
        return result;
      };

      const parsed = lines.slice(1).map((line, i) => {
        const values = parseRow(line);
        const obj = { rowNumber: i + 2 };
        headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
        
        // Validate
        obj.isValid = true;
        obj.errors = [];
        
        if (!obj.question_title) { obj.isValid = false; obj.errors.push('Missing question'); }
        if (!obj.option1_title || !obj.option2_title || !obj.option3_title || !obj.option4_title) {
          obj.isValid = false; obj.errors.push('Missing options');
        }
        const correctOpt = parseInt(obj.correct_option_number);
        if (isNaN(correctOpt) || correctOpt < 1 || correctOpt > 4) {
          obj.isValid = false; obj.errors.push('Invalid correct_option_number (must be 1-4)');
        }
        
        return obj;
      }).filter(q => q.question_title);

      if (parsed.length === 0) {
        toast.error('No valid questions found');
        return;
      }

      setPreviewData(parsed);
      setShowPreview(true);
      toast.success(`Parsed ${parsed.length} questions. Review and click Save or Publish.`);
    } catch (err) {
      toast.error('Failed to parse CSV');
      console.error(err);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save questions
  const saveQuestions = async (publish = false) => {
    if (!selectedTestId || previewData.length === 0) return;
    
    const validQuestions = previewData.filter(q => q.isValid);
    if (validQuestions.length === 0) {
      toast.error('No valid questions to save');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/questions/save-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mockTestId: selectedTestId,
          questions: validQuestions,
          publish
        })
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success(
          `Saved: ${result.data.inserted} inserted, ${result.data.duplicates} duplicates skipped, ${result.data.failed} failed` +
          (publish ? ' - Test Published!' : '')
        );
        setShowPreview(false);
        setPreviewData([]);
        fetchQuestions();
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const cancelPreview = () => {
    setShowPreview(false);
    setPreviewData([]);
  };

  const deleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      fetchQuestions();
      onRefresh();
    } catch (e) {
      toast.error('Failed');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Questions Management</h2>

      {/* Step 1: Select Exam */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" /> Step 1: Select Exam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Choose an exam (GATE, CAT, UPSC, JEE...)..." />
            </SelectTrigger>
            <SelectContent>
              {exams.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  <span className="flex items-center gap-2">
                    <span>{e.icon}</span> {e.name} - {e.fullName}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedExam && (
            <div className="mt-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{selectedExam.icon}</span>
                <div>
                  <p className="font-semibold text-teal-800">{selectedExam.name}</p>
                  <p className="text-sm text-teal-600">{selectedExam.fullName}</p>
                </div>
                <Badge className="ml-auto bg-teal-600">{selectedExam.category}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Test Type (only if exam selected) */}
      {selectedExamId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" /> Step 2: Select Test Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTestType} onValueChange={setSelectedTestType}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choose test type..." />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <span>{t.icon}</span> {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTypeInfo && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{selectedTypeInfo.icon}</span>
                  <div>
                    <p className="font-semibold text-purple-800">{selectedTypeInfo.label}</p>
                    <p className="text-sm text-purple-600">Timed test with answers shown after submission</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Test (only if test type selected) */}
      {selectedExamId && selectedTestType && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Step 3: Select Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMockTests.length > 0 ? (
              <>
                <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                  <SelectTrigger className="w-full md:w-96">
                    <SelectValue placeholder="Choose a test..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMockTests.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title} ({t.questionCount || t.totalQuestions || 0} Qs) {t.isPublished ? '✓' : '(Draft)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedTest && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge className={selectedTest.isPublished ? 'bg-green-500' : 'bg-yellow-500'}>
                        {selectedTest.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-sm text-gray-600">Duration: {selectedTest.duration} min</span>
                      <span className="text-sm text-gray-600">Questions: {questions.length}</span>
                      <span className="text-sm text-gray-600">{selectedTest.isFree ? 'FREE' : `₹${selectedTest.price}`}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center bg-gray-50 rounded-lg">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No {selectedTypeInfo?.label || 'tests'} found for {selectedExam?.name}</p>
                <p className="text-sm text-gray-400">Create a test first in the "Tests" tab</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Upload CSV (only if test selected) */}
      {selectedTestId && !showPreview && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-600" /> Step 4: Upload CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CSV File Upload */}
            <div className="flex flex-wrap items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv"
                onChange={handleCsvSelect}
                className="flex-1"
              />
              <Button variant="outline" onClick={downloadSampleCSV}>
                <Download className="w-4 h-4 mr-2" /> Sample
              </Button>
              <Button variant="outline" onClick={exportCSV} disabled={questions.length === 0}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>

            {/* Format Detection Result */}
            {csvFormat && (
              <div className={`p-3 rounded-lg border ${hasImageColumns ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2">
                  {hasImageColumns ? (
                    <>
                      <Badge className="bg-purple-600">NEW Format</Badge>
                      <span className="text-sm text-purple-700">Image columns detected ({detectedColumns.filter(c => c.includes('image')).length} columns)</span>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-green-600">OLD Format</Badge>
                      <span className="text-sm text-green-700">No image columns - standard import</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ZIP Upload - Only shown when image columns are detected */}
            {hasImageColumns && (
              <div className="p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
                <Label className="flex items-center gap-2 mb-2 text-purple-700 font-medium">
                  <Upload className="w-4 h-4" />
                  Upload Images ZIP (Optional)
                </Label>
                <Input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="bg-white"
                />
                {zipFile && (
                  <p className="text-sm text-purple-600 mt-2">
                    Selected: {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Supported: PNG, JPG, JPEG, WEBP. Max 100MB. If not uploaded, questions will import without images.
                </p>
              </div>
            )}

            {/* Import Button */}
            {csvFileSelected && (
              <Button 
                onClick={handleFileUpload} 
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import {csvFormat === 'new' ? '(with images)' : 'Questions'}
              </Button>
            )}

            <p className="text-xs text-gray-500">
              Required columns: question_title, option1_title, option2_title, option3_title, option4_title, correct_option_number (1-4)
              {hasImageColumns && <><br/>Image columns: question_image, option1_image, option2_image, option3_image, option4_image</>}
            </p>
          </CardContent>
        </Card>
      )}

      {/* CSV Preview */}
      {showPreview && (
        <Card className="mb-6 border-2 border-teal-500">
          <CardHeader className="bg-teal-50">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5" /> Preview - {previewData.length} Questions
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelPreview} disabled={saving}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button variant="outline" onClick={() => saveQuestions(false)} disabled={saving} className="border-blue-500 text-blue-600">
                  <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button onClick={() => saveQuestions(true)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-2" /> {saving ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Correct</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((q, i) => (
                    <TableRow key={i} className={!q.isValid ? 'bg-red-50' : ''}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm">{q.question_title}</p>
                      </TableCell>
                      <TableCell>{q.topic_title || '-'}</TableCell>
                      <TableCell className="text-xs">
                        1: {q.option1_title?.slice(0, 20)}...<br/>
                        2: {q.option2_title?.slice(0, 20)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Option {q.correct_option_number}</Badge>
                      </TableCell>
                      <TableCell>
                        {q.isValid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs">{q.errors.join(', ')}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{previewData.length}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{previewData.filter(q => q.isValid).length}</p>
                  <p className="text-sm text-gray-500">Valid</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{previewData.filter(q => !q.isValid).length}</p>
                  <p className="text-sm text-gray-500">Invalid</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Questions */}
      {selectedTestId && !showPreview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg">Questions in "{selectedTest?.title}"</CardTitle>
              {selectedQuestions.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Selected ({selectedQuestions.length})
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search..." className="pl-10 w-64" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={filteredQuestions.length > 0 && selectedQuestions.length === filteredQuestions.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Correct</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((q, i) => (
                    <TableRow key={q.id} className={selectedQuestions.includes(q.id) ? 'bg-teal-50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(q.id)}
                          onChange={() => toggleSelectQuestion(q.id)}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                      </TableCell>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="max-w-md"><p className="line-clamp-2 text-sm">{q.question_title}</p></TableCell>
                      <TableCell>{q.topic_title || '-'}</TableCell>
                      <TableCell><Badge variant="outline">Option {q.correct_option_number}</Badge></TableCell>
                      <TableCell><Badge className={q.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{q.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteQuestion(q.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredQuestions.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No questions yet. Upload a CSV to add questions.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Transactions Tab - ICICI Orange PG Payments
function TransactionsTab() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [processingRefund, setProcessingRefund] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const processRefund = async (transactionId) => {
    if (!confirm('Are you sure you want to process this refund?')) return;
    setProcessingRefund(transactionId);
    try {
      const res = await fetch('/api/admin/payment/process-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Refund processed successfully');
        fetchTransactions();
      } else {
        toast.error(data.error || 'Refund failed');
      }
    } catch (e) {
      toast.error('Failed to process refund');
    }
    setProcessingRefund(null);
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = 
      t.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      t.userName?.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      t.itemName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getRefundBadge = (refundStatus) => {
    if (!refundStatus) return null;
    switch (refundStatus) {
      case 'REQUESTED':
        return <Badge className="bg-orange-500">Refund Requested</Badge>;
      case 'PROCESSED':
        return <Badge className="bg-blue-500">Refunded</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500">Refund Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Transactions (ICICI Orange PG)</h2>
        <Button onClick={fetchTransactions} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
              <p className="text-sm text-gray-600">Successful</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-teal-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-teal-600">₹{stats.totalRevenue?.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refund Requests Alert */}
      {stats?.refundRequests > 0 && (
        <Card className="mb-6 bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 font-medium">
                {stats.refundRequests} refund request(s) pending
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search by ID, name, email..." 
            className="pl-10" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(txn => (
                <TableRow key={txn.id}>
                  <TableCell>
                    <div className="font-mono text-xs">{txn.transactionId}</div>
                    {txn.iciciTransactionId && (
                      <div className="text-xs text-gray-400">ICICI: {txn.iciciTransactionId}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{txn.userName}</div>
                    <div className="text-xs text-gray-500">{txn.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{txn.itemName}</div>
                    <div className="text-xs text-gray-400">{txn.paymentType}</div>
                  </TableCell>
                  <TableCell className="font-bold">₹{txn.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{txn.paymentMethod || '-'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(txn.status)}
                      {getRefundBadge(txn.refundStatus)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{new Date(txn.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">{new Date(txn.createdAt).toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {txn.refundStatus === 'REQUESTED' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-orange-600 border-orange-600"
                        onClick={() => processRefund(txn.transactionId)}
                        disabled={processingRefund === txn.transactionId}
                      >
                        {processingRefund === txn.transactionId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Process Refund'
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// Simple CRUD Table
function CRUDTable({ title, data, columns, onDelete, loading }) {
  const [search, setSearch] = useState('');
  const filtered = data.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-10 w-64" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(c => <TableHead key={c.key}>{c.label}</TableHead>)}
                {onDelete && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id}>
                  {columns.map(c => <TableCell key={c.key}>{c.render ? c.render(item[c.key], item) : item[c.key]}</TableCell>)}
                  {onDelete && <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>}
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={columns.length + (onDelete ? 1 : 0)} className="text-center py-8 text-gray-500">No data</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// Main Admin Page
export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ exams: [], mockTests: [], jobs: [], colleges: [], users: [], testimonials: [], contacts: [] });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      if (['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(u.role)) {
        setUser(u);
      } else {
        router.push('/');
      }
    } else {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await fetch('/api/admin/stats');
        const d = await res.json();
        if (d.success) setStats(d.data);
      } else if (activeTab === 'tests') {
        // Fetch both exams and mock tests
        const [examsRes, testsRes] = await Promise.all([
          fetch('/api/admin/exams'),
          fetch('/api/admin/mock-tests')
        ]);
        const examsData = await examsRes.json();
        const testsData = await testsRes.json();
        if (examsData.success) setData(p => ({ ...p, exams: examsData.data }));
        if (testsData.success) setData(p => ({ ...p, mockTests: testsData.data }));
      } else if (activeTab === 'questions') {
        // Fetch both exams and mock tests for questions tab
        const [examsRes, testsRes] = await Promise.all([
          fetch('/api/admin/exams'),
          fetch('/api/admin/mock-tests')
        ]);
        const examsData = await examsRes.json();
        const testsData = await testsRes.json();
        if (examsData.success) setData(p => ({ ...p, exams: examsData.data }));
        if (testsData.success) setData(p => ({ ...p, mockTests: testsData.data }));
      } else if (activeTab === 'exams') {
        const res = await fetch('/api/admin/exams');
        const d = await res.json();
        if (d.success) setData(p => ({ ...p, exams: d.data }));
      } else {
        const endpoints = { jobs: '/api/admin/jobs', colleges: '/api/admin/colleges', users: '/api/admin/users', testimonials: '/api/admin/testimonials', contacts: '/api/admin/contacts' };
        const endpoint = endpoints[activeTab];
        if (endpoint) {
          const res = await fetch(endpoint);
          const d = await res.json();
          if (d.success) setData(p => ({ ...p, [activeTab]: d.data }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleDelete = async (collection, id) => {
    if (!confirm('Delete?')) return;
    try {
      await fetch(`/api/admin/${collection}/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed');
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-xl font-semibold capitalize">{activeTab.replace('-', ' ')}</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user.name}</span>
              <Badge>{user.role}</Badge>
              <Button variant="ghost" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
            </div>
          </div>
        </header>
        <main className="p-8">
          {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
          {activeTab === 'exams' && <ExamsTab exams={data.exams} onRefresh={fetchData} />}
          {activeTab === 'tests' && <TestsTab mockTests={data.mockTests} exams={data.exams} onRefresh={fetchData} />}
          {activeTab === 'questions' && <QuestionsTab mockTests={data.mockTests} exams={data.exams} onRefresh={fetchData} />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'jobs' && <CRUDTable title="Jobs" data={data.jobs} columns={[{ key: 'title', label: 'Title' }, { key: 'organization', label: 'Org' }, { key: 'vacancies', label: 'Vacancies' }, { key: 'status', label: 'Status', render: v => <Badge className={v === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{v}</Badge> }]} onDelete={id => handleDelete('jobs', id)} loading={loading} />}
          {activeTab === 'colleges' && <CRUDTable title="Colleges" data={data.colleges} columns={[{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'ranking', label: 'Rank' }]} onDelete={id => handleDelete('colleges', id)} loading={loading} />}
          {activeTab === 'users' && <CRUDTable title="Users" data={data.users} columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'phoneVerified', label: 'Phone Verified', render: v => v ? <Badge className="bg-green-500">✓ Verified</Badge> : <Badge className="bg-gray-400">Not Verified</Badge> }, { key: 'authProvider', label: 'Auth', render: v => <Badge variant="outline">{v === 'google' ? '🔵 Google' : '📧 Email'}</Badge> }, { key: 'role', label: 'Role', render: v => <Badge>{v}</Badge> }]} loading={loading} />}
          {activeTab === 'testimonials' && <CRUDTable title="Testimonials" data={data.testimonials} columns={[{ key: 'name', label: 'Name' }, { key: 'exam', label: 'Exam' }, { key: 'rank', label: 'Rank' }]} onDelete={id => handleDelete('testimonials', id)} loading={loading} />}
          {activeTab === 'contacts' && <CRUDTable title="Contact Leads" data={data.contacts} columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'subject', label: 'Subject' }]} loading={loading} />}
        </main>
      </div>
    </div>
  );
}
