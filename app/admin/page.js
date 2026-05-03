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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  IndianRupee,
  Layers,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Quote,
  Code,
  Calendar as CalendarIcon,
  Star,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  FileDown,
  Library,
  FolderOpen,
  RefreshCw,
  Lock,
  Unlock,
  ScrollText,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  ClipboardCheck,
  Sparkles,
  Trophy,
  FileText as FileTextIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Test Types constant
const TEST_TYPES = [
  { value: 'mock_test', label: 'Mock Test', icon: '📝' },
  { value: 'practice_questions', label: 'Practice Questions', icon: '📚' },
  { value: 'previous_year', label: 'Previous Year Questions', icon: '📜' }
];

// Sidebar
function AdminSidebar({ activeTab, setActiveTab, userRole }) {
  const isAdminRole = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'exams', label: 'Test Series', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'domains', label: 'Domains', icon: <Layers className="w-5 h-5" /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'tests', label: 'Tests', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'questions', label: 'Questions', icon: <BookOpen className="w-5 h-5" /> },
    ...(isAdminRole ? [{ id: 'reviewer', label: 'Reviewer', icon: <ShieldCheck className="w-5 h-5" /> }] : []),
    { id: 'blogs', label: 'Blogs', icon: <FileText className="w-5 h-5" /> },
    { id: 'notes', label: 'Notes', icon: <FileDown className="w-5 h-5" /> },
    { id: 'notifications', label: 'Exam Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'pricing', label: 'Pricing', icon: <IndianRupee className="w-5 h-5" /> },
    { id: 'creative', label: 'Creative Control', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'answer-keys', label: 'Answer Keys', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'colleges', label: 'Colleges', icon: <Building className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'testimonials', label: 'Testimonials', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'contacts', label: 'Contact Leads', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg fixed left-0 top-0 bottom-0 z-40 flex flex-col">
      <div className="p-4 border-b flex-shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_unishaala-web/artifacts/2nf9p203_Unishaala-logo.jpg"
            alt="Unishaala" 
            className="h-10 w-auto object-contain"
          />
          <div>
            <span className="text-lg font-bold text-brand-600">Unishaala</span>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-1 pb-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-brand-50 text-brand-700 font-medium'
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
          { label: 'Exams', value: stats?.totalExams || 0, icon: <GraduationCap className="w-6 h-6" />, color: 'bg-brand-100 text-brand-600' },
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
          <Button onClick={() => { setEditingExam(null); setFormData({ name: '', fullName: '', description: '', category: 'Engineering', icon: '📚', price: 0, status: 'Active' }); setShowAddDialog(true); }} className="bg-brand-600 hover:bg-brand-700">
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
            <Button onClick={handleSave} disabled={loading} className="bg-brand-600 hover:bg-brand-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Domains Tab - Manage domains under exams
function DomainsTab({ exams, onRefresh }) {
  const [domains, setDomains] = useState([]);
  const [search, setSearch] = useState('');
  const [filterExamId, setFilterExamId] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', price: 0, status: 'Active', examId: ''
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/domains', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setDomains(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch domains:', e);
    }
    setLoading(false);
  };

  const filteredDomains = domains.filter(d => {
    const matchesSearch = d.name?.toLowerCase().includes(search.toLowerCase());
    const matchesExam = !filterExamId || d.examId === filterExamId;
    return matchesSearch && matchesExam;
  });

  const getExamName = (examId) => {
    const exam = exams?.find(e => e.id === examId);
    return exam ? exam.name : '-';
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    if (!formData.examId && !editingDomain) {
      toast.error('Please select an exam');
      return;
    }
    setLoading(true);
    try {
      const url = editingDomain ? `/api/admin/domains/${editingDomain.id}` : '/api/admin/domains';
      const method = editingDomain ? 'POST' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success(editingDomain ? 'Domain updated!' : 'Domain created!');
        setShowAddDialog(false);
        setEditingDomain(null);
        setFormData({ name: '', description: '', price: 0, status: 'Active', examId: '' });
        fetchDomains();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error('Failed to save');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this domain? Tests will be unassigned.')) return;
    try {
      await fetch(`/api/admin/domains/${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Deleted');
      fetchDomains();
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleEdit = (domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      description: domain.description || '',
      price: domain.price || 0,
      status: domain.status || 'Active',
      examId: domain.examId
    });
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Domains</h2>
          <p className="text-gray-500">Manage domains under each exam</p>
        </div>
        <Button onClick={() => { setEditingDomain(null); setFormData({ name: '', description: '', price: 0, status: 'Active', examId: '' }); setShowAddDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Domain
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search domains..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterExamId || "all"} onValueChange={v => setFilterExamId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams?.map(exam => (
              <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filteredDomains.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No domains found</TableCell></TableRow>
              ) : (
                filteredDomains.map(domain => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand-600" />
                        {domain.name}
                      </div>
                    </TableCell>
                    <TableCell>{getExamName(domain.examId)}</TableCell>
                    <TableCell>{domain.price > 0 ? `₹${domain.price}` : 'Free'}</TableCell>
                    <TableCell>
                      <Badge className={domain.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>
                        {domain.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(domain)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(domain.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDomain ? 'Edit Domain' : 'Add New Domain'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Exam *</Label>
              <Select value={formData.examId} onValueChange={v => setFormData({ ...formData, examId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Computer Science" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Domain description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingDomain ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tests Tab (replaces Mock Tests Tab) - with Test Type selection
function TestsTab({ mockTests, exams, onRefresh }) {
  const [domains, setDomains] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [filterExamId, setFilterExamId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', duration: 60, isFree: true, price: 0, status: 'Active', examId: '', domainId: '', subjectId: '', testType: 'mock_test'
  });

  useEffect(() => {
    fetchDomains();
    fetchSubjects();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/admin/domains', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setDomains(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch domains:', e);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/admin/subjects', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setSubjects(data.data || []);
    } catch (e) {
      console.error('Failed to fetch subjects:', e);
    }
  };

  // Get domains for selected exam
  const filteredDomains = domains.filter(d => d.examId === formData.examId);
  // Subjects scoped to selected exam + domain
  const filteredSubjects = subjects.filter(
    s => s.examId === formData.examId && s.domainId === formData.domainId
  );

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

  const getDomainName = (domainId) => {
    const domain = domains?.find(d => d.id === domainId);
    return domain ? domain.name : '-';
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
    if (formData.testType === 'practice_questions' && !formData.subjectId) {
      toast.error('Please select a subject for Practice Questions');
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
        setFormData({ title: '', description: '', duration: 60, isFree: true, price: 0, status: 'Active', examId: '', domainId: '', subjectId: '', testType: 'mock_test' });
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
          <Button onClick={() => { setEditingTest(null); setFormData({ title: '', description: '', duration: 60, isFree: true, price: 0, status: 'Active', examId: '', domainId: '', subjectId: '', testType: 'mock_test' }); setShowAddDialog(true); }} className="bg-brand-600 hover:bg-brand-700">
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
                  {test.reviewStatus === 'PENDING_REVIEW' && (
                    <Badge className="bg-amber-500 ml-1 text-[10px] px-1.5 py-0">In Review</Badge>
                  )}
                  {test.reviewStatus === 'REJECTED' && (
                    <Badge className="bg-red-500 ml-1 text-[10px] px-1.5 py-0">Rejected</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingTest(test); setFormData({ title: test.title, description: test.description || '', duration: test.duration, isFree: test.isFree ?? true, price: test.price || 0, status: test.status, examId: test.examId || '', domainId: test.domainId || '', subjectId: test.subjectId || '', testType: test.testType || 'mock_test' }); setShowAddDialog(true); }}>
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
              <Select value={formData.examId} onValueChange={v => setFormData({ ...formData, examId: v, domainId: '' })}>
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
            {/* Domain Selection */}
            {formData.examId && (
              <div>
                <Label>Domain *</Label>
                <Select value={formData.domainId || "none"} onValueChange={v => setFormData({ ...formData, domainId: v === "none" ? "" : v, subjectId: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Select Domain --</SelectItem>
                    {filteredDomains.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Test Type Selection - only show after domain selected */}
            {formData.domainId && (
              <div>
                <Label>Test Type *</Label>
                <Select value={formData.testType} onValueChange={v => setFormData({ ...formData, testType: v, subjectId: '' })}>
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
            )}
            {/* Subject Selection - ONLY for Practice Questions */}
            {formData.testType === 'practice_questions' && formData.domainId && (
              <div>
                <Label>Subject *</Label>
                <Select
                  value={formData.subjectId || 'none'}
                  onValueChange={v => setFormData({ ...formData, subjectId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Select Subject --</SelectItem>
                    {filteredSubjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filteredSubjects.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">
                    No subjects yet for this domain. Create one in the <strong>Subjects</strong> tab first.
                  </p>
                )}
              </div>
            )}
            {/* Title - show after test type selected */}
            {formData.testType && formData.domainId && (
              <>
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
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-brand-600 hover:bg-brand-700">
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
  const [domains, setDomains] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
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

  // PYQ PDF Attachment State
  const [currentTestData, setCurrentTestData] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfPermission, setPdfPermission] = useState('view');
  const pdfInputRef = useRef(null);

  // Fetch domains on mount
  useEffect(() => {
    fetchDomains();
    fetchSubjects();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/admin/domains', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setDomains(data.data || []);
    } catch (e) {
      console.error('Failed to fetch domains:', e);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/admin/subjects', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setSubjects(data.data || []);
    } catch (e) {
      console.error('Failed to fetch subjects:', e);
    }
  };

  // Filtered domains for selected exam
  const filteredDomains = domains.filter(d => d.examId === selectedExamId);

  // Subjects scoped to selected exam + domain
  const filteredSubjects = subjects.filter(
    s => s.examId === selectedExamId && s.domainId === selectedDomainId
  );

  // Filter mock tests by selected exam, domain, test type, and (when practice) subject
  const filteredMockTests = mockTests.filter(t => {
    const matchesExam = !selectedExamId || t.examId === selectedExamId;
    const matchesDomain = !selectedDomainId || t.domainId === selectedDomainId;
    const matchesType = !selectedTestType || t.testType === selectedTestType;
    const matchesSubject = selectedTestType !== 'practice_questions'
      || !selectedSubjectId
      || t.subjectId === selectedSubjectId;
    return matchesExam && matchesDomain && matchesType && matchesSubject;
  });

  // Reset subsequent selections when parent changes
  useEffect(() => {
    setSelectedDomainId('');
    setSelectedTestType('');
    setSelectedTestId('');
    setQuestions([]);
    setPreviewData([]);
    setShowPreview(false);
    setSelectedQuestions([]);
  }, [selectedExamId]);

  useEffect(() => {
    setSelectedTestType('');
    setSelectedSubjectId('');
    setSelectedTestId('');
    setQuestions([]);
    setPreviewData([]);
    setShowPreview(false);
    setSelectedQuestions([]);
  }, [selectedDomainId]);

  useEffect(() => {
    setSelectedSubjectId('');
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

  // Fetch full test details (incl. PDF metadata) when a test is selected
  const refreshTestData = async () => {
    if (!selectedTestId) { setCurrentTestData(null); return; }
    try {
      const res = await fetch('/api/admin/mock-tests', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const t = (data.data || []).find(x => x.id === selectedTestId);
        setCurrentTestData(t || null);
        if (t?.pdfPermission) setPdfPermission(t.pdfPermission);
        else setPdfPermission('view');
      }
    } catch (e) { console.error('Failed to fetch test details', e); }
  };

  useEffect(() => { refreshTestData(); /* eslint-disable-next-line */ }, [selectedTestId]);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) { toast.error('Please choose a .pdf file'); return; }
    if (file.size > 25 * 1024 * 1024) { toast.error('PDF too large (max 25 MB)'); return; }

    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('permission', pdfPermission);
      const res = await fetch(`/api/admin/mock-tests/${selectedTestId}/upload-pdf`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentTestData?.pdfFileId ? 'PDF replaced' : 'PDF uploaded');
        setCurrentTestData(data.data);
        if (data.data?.pdfPermission) setPdfPermission(data.data.pdfPermission);
        onRefresh && onRefresh();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handlePdfDelete = async () => {
    if (!confirm('Remove the attached PDF for this PYQ test?')) return;
    try {
      const res = await fetch(`/api/admin/mock-tests/${selectedTestId}/upload-pdf`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('PDF removed');
        setCurrentTestData(data.data);
        setPdfPermission('view');
        onRefresh && onRefresh();
      } else {
        toast.error(data.error || 'Failed to remove');
      }
    } catch (err) { toast.error('Failed to remove'); }
  };

  const handlePermissionChange = async (val) => {
    setPdfPermission(val);
    if (!currentTestData?.pdfFileId) return; // only persist if a PDF is attached
    try {
      const res = await fetch(`/api/admin/mock-tests/${selectedTestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pdfPermission: val }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('PDF access updated');
        await refreshTestData();
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch (err) { toast.error('Failed to update'); }
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
    // Serve the exact pre-uploaded sample CSV (kept under /public/samples/)
    const a = document.createElement('a');
    a.href = '/samples/previous_year_paper_questions_sample.csv';
    a.download = 'previous_year_paper_questions_sample.csv';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  // Save questions (with ZIP support)
  const saveQuestions = async (publish = false) => {
    if (!selectedTestId || previewData.length === 0) return;
    
    const validQuestions = previewData.filter(q => q.isValid);
    if (validQuestions.length === 0) {
      toast.error('No valid questions to save');
      return;
    }

    setSaving(true);
    try {
      // Use the image-aware import-questions endpoint whenever the CSV has
      // any image columns, regardless of whether a ZIP file was attached.
      // The endpoint auto-detects URL-mode (Bunny.net etc.) and handles it.
      if (hasImageColumns) {
        const formData = new FormData();
        formData.append('test_id', selectedTestId);
        formData.append('csv_file', csvFileSelected);
        // Default Replace mode so re-uploads stay idempotent (no duplicates).
        formData.append('replace_existing', 'true');
        if (zipFile) {
          formData.append('images_zip', zipFile);
        }
        if (publish) formData.append('publish', 'true');

        const res = await fetch('/api/admin/import-questions', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        
        const result = await res.json();
        
        if (result.success) {
          const parts = [
            `Imported: ${result.imported} new`,
            `${result.updated} updated`,
            `${result.skipped} skipped`
          ];
          if (result.replaced > 0) parts.push(`${result.replaced} replaced`);
          if (result.invalid_image_urls?.length > 0) parts.push(`${result.invalid_image_urls.length} invalid URLs`);
          if (result.missing_images?.length > 0) parts.push(`${result.missing_images.length} missing images`);
          toast.success(parts.join(', ') + (publish ? ' — Sent to Reviewer' : ''));
          setShowPreview(false);
          setPreviewData([]);
          setZipFile(null);
          setCsvFileSelected(null);
          setCsvFormat(null);
          setHasImageColumns(false);
          fetchQuestions();
          onRefresh();
        } else {
          toast.error(result.error || 'Import failed');
        }
      } else {
        // No image columns — use the simple save-batch path.
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
            (publish ? ' — Sent to Reviewer' : '')
          );
          setShowPreview(false);
          setPreviewData([]);
          fetchQuestions();
          onRefresh();
        } else {
          toast.error(result.error);
        }
      }
    } catch (e) {
      console.error('Save error:', e);
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
            <GraduationCap className="w-5 h-5 text-brand-600" /> Step 1: Select Exam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedExamId || "none"} onValueChange={v => setSelectedExamId(v === "none" ? "" : v)}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Choose an exam (GATE, CAT, UPSC, JEE...)..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Select Exam --</SelectItem>
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
            <div className="mt-4 p-4 bg-brand-50 rounded-lg border border-brand-200">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{selectedExam.icon}</span>
                <div>
                  <p className="font-semibold text-brand-800">{selectedExam.name}</p>
                  <p className="text-sm text-brand-600">{selectedExam.fullName}</p>
                </div>
                <Badge className="ml-auto bg-brand-600">{selectedExam.category}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Domain (only if exam selected) */}
      {selectedExamId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Step 2: Select Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedDomainId || "none"} onValueChange={v => setSelectedDomainId(v === "none" ? "" : v)}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choose a domain..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Select Domain --</SelectItem>
                {filteredDomains.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4" /> {d.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Test Type (only if domain selected) */}
      {selectedExamId && selectedDomainId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" /> Step 3: Select Test Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTestType || "none"} onValueChange={v => setSelectedTestType(v === "none" ? "" : v)}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choose test type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Select Test Type --</SelectItem>
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

      {/* Step 4: Select Test (only if test type selected) */}
      {/* Step 4 (Practice Questions only): Select Subject */}
      {selectedExamId && selectedDomainId && selectedTestType === 'practice_questions' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" /> Step 4: Select Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSubjectId || 'none'} onValueChange={v => setSelectedSubjectId(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choose a subject..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Select Subject --</SelectItem>
                {filteredSubjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredSubjects.length === 0 && (
              <p className="text-xs text-amber-700 mt-2">
                No subjects yet for this exam &amp; domain. Create one in the <strong>Subjects</strong> tab first.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedExamId && selectedDomainId && selectedTestType && (selectedTestType !== 'practice_questions' || selectedSubjectId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> {selectedTestType === 'practice_questions' ? 'Step 5' : 'Step 4'}: Select Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMockTests.length > 0 ? (
              <>
                <Select value={selectedTestId || "none"} onValueChange={v => setSelectedTestId(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full md:w-96">
                    <SelectValue placeholder="Choose a test..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Select Test --</SelectItem>
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

      {/* PYQ PDF Attachment (only for previous_year test type) */}
      {selectedTestId && selectedTestType === 'previous_year' && (
        <Card className="mb-6 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-purple-600" /> PYQ PDF Attachment
              <Badge variant="outline" className="text-xs ml-1 border-purple-300 text-purple-700">Optional</Badge>
            </CardTitle>
            <p className="text-sm text-gray-500">
              Attach the original question paper PDF. When attached, users see a split button: <b>Download/View PDF</b> + <b>Start Test</b>. PDFs are stored in MongoDB GridFS.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTestData?.pdfFileId ? (
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                      <FileTextIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate" title={currentTestData.pdfFileName}>
                        {currentTestData.pdfFileName || 'PDF attached'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {currentTestData.pdfPageCount || 0} pages · {((currentTestData.pdfSize || 0) / 1024 / 1024).toFixed(2)} MB · uploaded {currentTestData.pdfUploadedAt ? new Date(currentTestData.pdfUploadedAt).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/pdfs/${currentTestData.pdfPreviewFileId}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-700 hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" /> Preview
                    </a>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-700">PDF Access</Label>
                    <Select value={pdfPermission} onValueChange={handlePermissionChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only (no download)</SelectItem>
                        <SelectItem value="view_download">Download Allowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfUpload}
                      disabled={pdfUploading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handlePdfDelete}
                      disabled={pdfUploading}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Pick a new PDF in the file box above to <b>replace</b> the current one (max 25 MB).</p>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <div>
                    <Label className="text-sm text-gray-700">Choose a PDF (max 25 MB)</Label>
                    <Input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfUpload}
                      disabled={pdfUploading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700">PDF Access</Label>
                    <Select value={pdfPermission} onValueChange={setPdfPermission}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only (no download)</SelectItem>
                        <SelectItem value="view_download">Download Allowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {pdfUploading && (
                  <p className="text-xs text-purple-700 mt-2 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading & generating preview…
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">No PDF attached. The user-side PYQ test card will show a normal Start Test button.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Upload CSV (only if test selected) */}
      {selectedTestId && !showPreview && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-600" /> Step 5: Upload Questions
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
                className="w-full bg-brand-600 hover:bg-brand-700"
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
        <Card className="mb-6 border-2 border-brand-500">
          <CardHeader className="bg-brand-50">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5" /> Preview - {previewData.length} Questions
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelPreview} disabled={saving}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={() => saveQuestions(true)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-2" /> {saving ? 'Sending...' : 'Send to Review'}
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
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={filteredQuestions.length > 0 && selectedQuestions.length === filteredQuestions.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
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
                    <TableRow key={q.id} className={selectedQuestions.includes(q.id) ? 'bg-brand-50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(q.id)}
                          onChange={() => toggleSelectQuestion(q.id)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
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
        credentials: 'include',
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
        credentials: 'include',
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
          <Card className="bg-brand-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-brand-600">₹{stats.totalRevenue?.toLocaleString()}</p>
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
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
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
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
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

// ====================== BLOGS TAB ======================
// Rich Text Editor using contenteditable + execCommand
function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLabel, setPdfLabel] = useState('');
  const [pdfTab, setPdfTab] = useState('library');
  const [pdfLibrary, setPdfLibrary] = useState([]);
  const [pdfLibLoading, setPdfLibLoading] = useState(false);
  const [pdfSearch, setPdfSearch] = useState('');
  const [selectedLibPdf, setSelectedLibPdf] = useState(null);
  const [overrideLabel, setOverrideLabel] = useState('');
  const [quickUploading, setQuickUploading] = useState(false);
  const savedSelection = useRef(null);
  const quickUploadInputRef = useRef(null);
  const [quickUploadLabel, setQuickUploadLabel] = useState('');

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (cmd, arg = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedSelection.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  };

  const handleLinkClick = () => {
    saveSelection();
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const applyLink = () => {
    restoreSelection();
    if (linkUrl) {
      exec('createLink', linkUrl);
      // Open link in new tab by default
      setTimeout(() => {
        const links = editorRef.current?.querySelectorAll('a');
        links?.forEach(a => {
          if (!a.hasAttribute('data-blog-button')) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          }
        });
        handleInput();
      }, 10);
    }
    setLinkDialogOpen(false);
  };

  const fetchPdfLibrary = async () => {
    setPdfLibLoading(true);
    try {
      const res = await fetch('/api/admin/blog-pdfs', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setPdfLibrary(d.data || []);
      else toast.error(d.error || 'Failed to load PDF library');
    } catch (_e) {
      toast.error('Failed to load PDF library');
    }
    setPdfLibLoading(false);
  };

  const handlePdfClick = () => {
    saveSelection();
    setPdfUrl('');
    setPdfLabel('');
    setSelectedLibPdf(null);
    setOverrideLabel('');
    setPdfSearch('');
    setPdfTab('library');
    setQuickUploadLabel('');
    setPdfDialogOpen(true);
    fetchPdfLibrary();
  };

  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const label = quickUploadLabel.trim() || file.name.replace(/\.pdf$/i, '') || 'Download PDF';
    if (!/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name || '')) {
      toast.error('File must be a PDF');
      e.target.value = '';
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('PDF too large (max 25MB)');
      e.target.value = '';
      return;
    }
    setQuickUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('label', label);
      const res = await fetch('/api/admin/blog-pdfs', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const d = await res.json();
      if (d.success) {
        toast.success('PDF uploaded to library');
        setPdfLibrary((prev) => [d.data, ...prev]);
        setSelectedLibPdf(d.data);
        setQuickUploadLabel('');
      } else {
        toast.error(d.error || 'Upload failed');
      }
    } catch (_e) {
      toast.error('Upload failed');
    }
    setQuickUploading(false);
    e.target.value = '';
  };

  const applyPdfButton = () => {
    restoreSelection();
    let viewerUrl = '';
    let label = '';

    if (pdfTab === 'library') {
      if (!selectedLibPdf) {
        toast.error('Select a PDF from the library');
        return;
      }
      label = (overrideLabel.trim() || selectedLibPdf.label || 'Download PDF');
      viewerUrl = `/blogs/pdf-viewer?pdfId=${encodeURIComponent(selectedLibPdf.id)}&label=${encodeURIComponent(label)}`;
    } else {
      // External URL mode
      if (!pdfUrl || !/^https?:\/\//i.test(pdfUrl)) {
        toast.error('Enter a valid http(s) PDF URL');
        return;
      }
      label = pdfLabel.trim() || 'Click Here';
      viewerUrl = `/blogs/pdf-viewer?url=${encodeURIComponent(pdfUrl)}&label=${encodeURIComponent(label)}`;
    }

    const btnHtml = `<a href="${viewerUrl}" data-blog-button="true" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#0d9488;color:#fff;padding:8px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;cursor:pointer;">${label}</a>&nbsp;`;
    document.execCommand('insertHTML', false, btnHtml);
    handleInput();
    setPdfDialogOpen(false);
  };

  const handleImageInsert = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large (max 10MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: base64, filename: file.name })
        });
        const d = await res.json();
        if (d.success) {
          editorRef.current?.focus();
          exec('insertImage', d.data.url);
          toast.success('Image inserted');
        } else {
          toast.error(d.error || 'Upload failed');
        }
      } catch (err) {
        toast.error('Upload failed');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const ToolButton = ({ onClick, title, children }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="p-2 rounded hover:bg-brand-50 text-gray-700 hover:text-brand-700 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b bg-gray-50">
        <ToolButton onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold className="w-4 h-4" /></ToolButton>
        <ToolButton onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic className="w-4 h-4" /></ToolButton>
        <ToolButton onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline className="w-4 h-4" /></ToolButton>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolButton onClick={() => exec('formatBlock', '<h1>')} title="Heading 1"><Heading1 className="w-4 h-4" /></ToolButton>
        <ToolButton onClick={() => exec('formatBlock', '<h2>')} title="Heading 2"><Heading2 className="w-4 h-4" /></ToolButton>
        <ToolButton onClick={() => exec('formatBlock', '<p>')} title="Paragraph"><span className="text-xs font-semibold">P</span></ToolButton>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolButton onClick={() => exec('insertUnorderedList')} title="Bullet List"><List className="w-4 h-4" /></ToolButton>
        <ToolButton onClick={() => exec('insertOrderedList')} title="Numbered List"><ListOrdered className="w-4 h-4" /></ToolButton>
        <ToolButton onClick={() => exec('formatBlock', '<blockquote>')} title="Quote"><Quote className="w-4 h-4" /></ToolButton>
        <ToolButton onClick={() => exec('formatBlock', '<pre>')} title="Code Block"><Code className="w-4 h-4" /></ToolButton>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolButton onClick={handleLinkClick} title="Insert Link"><Link2 className="w-4 h-4" /></ToolButton>
        <ToolButton onClick={handlePdfClick} title="Insert PDF Button"><FileDown className="w-4 h-4" /></ToolButton>
        <label className="p-2 rounded hover:bg-brand-50 text-gray-700 hover:text-brand-700 transition-colors cursor-pointer" title="Insert Image">
          <ImageIcon className="w-4 h-4" />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageInsert} />
        </label>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolButton onClick={() => exec('removeFormat')} title="Clear Formatting"><X className="w-4 h-4" /></ToolButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        suppressContentEditableWarning
        className="rich-editor min-h-[300px] max-h-[500px] overflow-y-auto p-4 focus:outline-none prose max-w-none"
        data-placeholder={placeholder || 'Start writing your blog post...'}
      />

      <style jsx>{`
        .rich-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rich-editor h1 { font-size: 1.875rem; font-weight: 700; margin: 0.75em 0 0.4em; }
        .rich-editor h2 { font-size: 1.5rem; font-weight: 700; margin: 0.75em 0 0.4em; }
        .rich-editor h3 { font-size: 1.25rem; font-weight: 600; margin: 0.75em 0 0.4em; }
        .rich-editor p { margin: 0.5em 0; line-height: 1.7; }
        .rich-editor ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-editor ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-editor li { margin: 0.25em 0; }
        .rich-editor a { color: #0d9488; text-decoration: underline; }
        .rich-editor a[data-blog-button] {
          display: inline-block;
          background: #0d9488;
          color: #fff !important;
          padding: 6px 16px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          margin: 2px 0;
        }
        .rich-editor blockquote { border-left: 4px solid #14b8a6; padding: 0.25em 0.75em; margin: 0.75em 0; color: #4b5563; background: #f0fdfa; }
        .rich-editor pre { background: #0f172a; color: #e2e8f0; padding: 0.75em; border-radius: 0.375em; overflow-x: auto; }
        .rich-editor img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.5em 0; }
        .rich-editor strong { font-weight: 700; }
      `}</style>

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>URL</Label>
            <Input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={applyLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Button dialog with Library picker + External URL */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Insert PDF Button</DialogTitle>
            <DialogDescription>Choose a PDF from your library, or paste an external URL.</DialogDescription>
          </DialogHeader>

          <Tabs value={pdfTab} onValueChange={setPdfTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library">
                <Library className="w-4 h-4 mr-2" /> From Library
              </TabsTrigger>
              <TabsTrigger value="url">
                <ExternalLink className="w-4 h-4 mr-2" /> External URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col mt-3">
              {/* Quick upload */}
              <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-3 mb-3">
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <Input
                    placeholder="Button label for new PDF (e.g. Download Notes)"
                    value={quickUploadLabel}
                    onChange={(e) => setQuickUploadLabel(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    ref={quickUploadInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleQuickUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => quickUploadInputRef.current?.click()}
                    disabled={quickUploading}
                    className="shrink-0"
                  >
                    {quickUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Upload new PDF</>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">Max 25 MB. Uploaded PDFs appear in the library below.</p>
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Search library by label or filename…"
                  value={pdfSearch}
                  onChange={(e) => setPdfSearch(e.target.value)}
                />
              </div>

              {/* Library list */}
              <div className="border rounded-lg overflow-y-auto flex-1 min-h-[180px] max-h-[280px]">
                {pdfLibLoading ? (
                  <div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
                ) : pdfLibrary.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    <FileDown className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No PDFs in library. Upload one above to get started.
                  </div>
                ) : (
                  (() => {
                    const q = pdfSearch.trim().toLowerCase();
                    const filtered = q
                      ? pdfLibrary.filter((p) =>
                          (p.label || '').toLowerCase().includes(q) ||
                          (p.fileName || '').toLowerCase().includes(q)
                        )
                      : pdfLibrary;
                    if (filtered.length === 0) {
                      return <div className="p-6 text-center text-sm text-gray-500">No PDFs match your search.</div>;
                    }
                    return (
                      <ul className="divide-y">
                        {filtered.map((p) => {
                          const selected = selectedLibPdf?.id === p.id;
                          return (
                            <li
                              key={p.id}
                              onClick={() => setSelectedLibPdf(p)}
                              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                selected ? 'bg-brand-50 ring-1 ring-brand-400' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="shrink-0 w-9 h-9 rounded bg-red-50 flex items-center justify-center">
                                <FileDown className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 truncate">{p.label}</div>
                                <div className="text-[11px] text-gray-500 truncate">{p.fileName} • {(p.size / 1024 / 1024).toFixed(2)} MB</div>
                              </div>
                              {selected && <CheckCircle className="w-4 h-4 text-brand-600 shrink-0" />}
                            </li>
                          );
                        })}
                      </ul>
                    );
                  })()
                )}
              </div>

              {/* Optional label override */}
              {selectedLibPdf && (
                <div className="mt-3">
                  <Label className="text-xs">
                    Override button label (optional) <span className="text-gray-400 font-normal">— leave blank to use &quot;{selectedLibPdf.label}&quot;</span>
                  </Label>
                  <Input
                    value={overrideLabel}
                    onChange={(e) => setOverrideLabel(e.target.value)}
                    placeholder={selectedLibPdf.label}
                    className="mt-1"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="mt-3 space-y-3">
              <div>
                <Label>PDF URL</Label>
                <Input
                  autoFocus={pdfTab === 'url'}
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://example.com/file.pdf"
                  onKeyDown={(e) => { if (e.key === 'Enter') applyPdfButton(); }}
                />
              </div>
              <div>
                <Label>Button Label <span className="text-gray-400 font-normal">(default: &quot;Click Here&quot;)</span></Label>
                <Input
                  value={pdfLabel}
                  onChange={(e) => setPdfLabel(e.target.value)}
                  placeholder="Click Here"
                  onKeyDown={(e) => { if (e.key === 'Enter') applyPdfButton(); }}
                />
              </div>
              <p className="text-[11px] text-gray-500">External PDFs render via Google Docs Viewer. For your own PDFs prefer the Library tab.</p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-brand-600 hover:bg-brand-700"
              onClick={applyPdfButton}
              disabled={pdfTab === 'library' ? !selectedLibPdf : !pdfUrl}
            >
              Insert PDF Button
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BlogPdfLibraryDialog({ open, onOpenChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const fileInputRef = useRef(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog-pdfs', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setItems(d.data || []);
      else toast.error(d.error || 'Failed to load PDFs');
    } catch (_e) {
      toast.error('Failed to load PDFs');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchItems();
  }, [open]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const label = newLabel.trim() || file.name.replace(/\.pdf$/i, '');
    if (!label) {
      toast.error('Enter a button label first');
      e.target.value = '';
      return;
    }
    if (!/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name || '')) {
      toast.error('File must be a PDF');
      e.target.value = '';
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('PDF too large (max 25MB)');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('label', label);
      const res = await fetch('/api/admin/blog-pdfs', { method: 'POST', body: fd, credentials: 'include' });
      const d = await res.json();
      if (d.success) {
        toast.success('PDF uploaded');
        setItems((prev) => [d.data, ...prev]);
        setNewLabel('');
      } else {
        toast.error(d.error || 'Upload failed');
      }
    } catch (_e) {
      toast.error('Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingLabel(item.label);
  };

  const saveEdit = async (item) => {
    const label = editingLabel.trim();
    if (!label) { toast.error('Label cannot be empty'); return; }
    try {
      const res = await fetch(`/api/admin/blog-pdfs/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Label updated');
        setItems((prev) => prev.map((p) => (p.id === item.id ? d.data : p)));
        setEditingId(null);
      } else {
        toast.error(d.error || 'Update failed');
      }
    } catch (_e) { toast.error('Update failed'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete PDF "${item.label}"? Buttons already inserted in blogs will show "PDF no longer available" when clicked.`)) return;
    try {
      const res = await fetch(`/api/admin/blog-pdfs/${item.id}`, { method: 'DELETE', credentials: 'include' });
      const d = await res.json();
      if (d.success) {
        toast.success('PDF deleted');
        setItems((prev) => prev.filter((p) => p.id !== item.id));
      } else {
        toast.error(d.error || 'Delete failed');
      }
    } catch (_e) { toast.error('Delete failed'); }
  };

  const copyShortcode = (item) => {
    const url = `${window.location.origin}/api/blog-pdfs/${item.id}/file`;
    navigator.clipboard?.writeText(url);
    toast.success('Direct file URL copied');
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((p) => (p.label || '').toLowerCase().includes(q) || (p.fileName || '').toLowerCase().includes(q))
    : items;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5 text-brand-600" /> Blog PDF Library
          </DialogTitle>
          <DialogDescription>
            Upload and manage PDFs available for insertion into any blog post. Up to 25 MB each, no quantity limit.
          </DialogDescription>
        </DialogHeader>

        {/* Uploader */}
        <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-3">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <Input
              placeholder="Button label for this PDF (e.g. Download Notes, Click Here)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1"
            />
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-brand-600 hover:bg-brand-700 shrink-0"
            >
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4 mr-2" /> Upload PDF</>}
            </Button>
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">The button label is shown inside the blog. You can override it per insertion.</p>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by label or filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto border rounded-lg mt-3 min-h-[200px]">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <FileDown className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              {items.length === 0 ? 'No PDFs yet. Upload your first PDF above.' : 'No PDFs match your search.'}
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50">
                  <div className="shrink-0 w-10 h-10 rounded bg-red-50 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === p.id ? (
                      <Input
                        autoFocus
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(p); if (e.key === 'Escape') setEditingId(null); }}
                        className="h-8"
                      />
                    ) : (
                      <div className="font-medium text-sm text-gray-900 truncate">{p.label}</div>
                    )}
                    <div className="text-[11px] text-gray-500 truncate mt-0.5">
                      {p.fileName} • {(p.size / 1024 / 1024).toFixed(2)} MB • {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === p.id ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} title="Cancel">
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-brand-600 hover:bg-brand-700" onClick={() => saveEdit(p)} title="Save">
                          <Save className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <a href={`/api/blog-pdfs/${p.id}/file`} target="_blank" rel="noopener noreferrer" title="Preview PDF">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0"><Eye className="w-4 h-4" /></Button>
                        </a>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Rename label" onClick={() => startEdit(p)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Delete" onClick={() => handleDelete(p)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={fetchItems} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BlogsTab() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    image: '',
    publishDate: '',
    status: 'draft',
    pdfPermission: 'view'
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfLibraryOpen, setPdfLibraryOpen] = useState(false);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blogs', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setBlogs(d.data || []);
    } catch (e) {
      toast.error('Failed to load blogs');
    }
    setLoading(false);
  };

  useEffect(() => { fetchBlogs(); }, []);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      content: '',
      image: '',
      publishDate: new Date().toISOString().slice(0, 10),
      status: 'draft',
      pdfPermission: 'view'
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (blog) => {
    setEditing(blog);
    setForm({
      title: blog.title || '',
      description: blog.description || '',
      content: blog.content || '',
      image: blog.image || '',
      publishDate: blog.publishDate ? new Date(blog.publishDate).toISOString().slice(0, 10) : '',
      status: blog.status || 'draft',
      pdfPermission: blog.pdfPermission || 'view'
    });
    setDialogOpen(true);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large (max 10MB)');
      return;
    }
    setUploadingCover(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: ev.target.result, filename: file.name })
        });
        const d = await res.json();
        if (d.success) {
          setForm(p => ({ ...p, image: d.data.url }));
          toast.success('Cover image uploaded');
        } else {
          toast.error(d.error || 'Upload failed');
        }
      } catch (err) {
        toast.error('Upload failed');
      }
      setUploadingCover(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const validate = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return false; }
    if (!form.content || !form.content.replace(/<[^>]+>/g, '').trim()) {
      toast.error('Content is required'); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        content: form.content,
        image: form.image || null,
        publishDate: form.publishDate || new Date().toISOString(),
        status: form.status,
        pdfPermission: form.pdfPermission || 'view'
      };
      const url = editing ? `/api/admin/blogs/${editing.id}` : '/api/admin/blogs';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        toast.success(editing ? 'Blog updated' : 'Blog created');
        // If this was a new blog, reopen in edit mode so PDF can be attached
        if (!editing && d.data) {
          setEditing(d.data);
          setForm((p) => ({ ...p, pdfPermission: d.data.pdfPermission || 'view' }));
          toast.info('You can now attach a PDF to this post', { duration: 4000 });
        } else {
          setDialogOpen(false);
          resetForm();
        }
        fetchBlogs();
      } else {
        toast.error(d.error || 'Save failed');
      }
    } catch (e) {
      toast.error('Save failed');
    }
    setSaving(false);
  };

  // ---- PDF Handlers ----
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!editing?.id) {
      toast.error('Save the blog first, then attach a PDF.');
      e.target.value = '';
      return;
    }
    if (!/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name || '')) {
      toast.error('Please select a PDF file');
      e.target.value = '';
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('PDF too large (max 25 MB)');
      e.target.value = '';
      return;
    }
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('permission', form.pdfPermission || 'view');

      const res = await fetch(`/api/admin/blogs/${editing.id}/upload-pdf`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      });
      const d = await res.json();
      if (d.success) {
        setEditing(d.data);
        toast.success('PDF uploaded successfully');
        fetchBlogs();
      } else {
        toast.error(d.error || 'PDF upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('PDF upload failed');
    }
    setUploadingPdf(false);
    e.target.value = '';
  };

  const handlePdfRemove = async () => {
    if (!editing?.id) return;
    if (!confirm('Remove the attached PDF? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/blogs/${editing.id}/upload-pdf`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const d = await res.json();
      if (d.success) {
        setEditing(d.data);
        toast.success('PDF removed');
        fetchBlogs();
      } else {
        toast.error(d.error || 'Failed to remove PDF');
      }
    } catch (e) {
      toast.error('Failed to remove PDF');
    }
  };

  const handlePermissionChange = async (newValue) => {
    setForm((p) => ({ ...p, pdfPermission: newValue }));
    // Persist immediately if editing an existing blog with a PDF
    if (editing?.id && editing?.pdfFileId) {
      try {
        const res = await fetch(`/api/admin/blogs/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ pdfPermission: newValue })
        });
        const d = await res.json();
        if (d.success) {
          setEditing(d.data);
          toast.success('PDF permission updated');
          fetchBlogs();
        }
      } catch (e) { /* ignore */ }
    }
  };

  const handleDelete = async (blog) => {
    if (!confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Blog deleted');
        fetchBlogs();
      } else {
        toast.error(d.error || 'Delete failed');
      }
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const togglePublish = async (blog) => {
    try {
      const newStatus = blog.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const d = await res.json();
      if (d.success) {
        toast.success(newStatus === 'published' ? 'Blog published' : 'Moved to draft');
        fetchBlogs();
      } else {
        toast.error(d.error || 'Update failed');
      }
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const filtered = blogs.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Posts</h2>
          <p className="text-sm text-gray-500">Create and manage blog content shown on the website</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setPdfLibraryOpen(true)} variant="outline" className="border-brand-300 text-brand-700 hover:bg-brand-50">
            <Library className="w-4 h-4 mr-2" /> PDF Library
          </Button>
          <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="w-4 h-4 mr-2" /> New Blog Post
          </Button>
        </div>
      </div>

      <BlogPdfLibraryDialog open={pdfLibraryOpen} onOpenChange={setPdfLibraryOpen} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {blogs.length === 0 ? 'No blog posts yet. Click "New Blog Post" to create one.' : 'No blogs match your filters.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish Date</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {b.image ? (
                        <img src={b.image} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 line-clamp-1">{b.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">/blogs/{b.slug}</div>
                      {b.pdfFileId && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 border border-brand-200 rounded px-1.5 py-0.5">
                          <FileDown className="w-3 h-3" />
                          PDF attached
                          {b.pdfPermission === 'view_download' ? (
                            <span className="ml-1 text-green-700">• Downloadable</span>
                          ) : (
                            <span className="ml-1 text-amber-700">• View only</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.status === 'published' ? (
                        <Badge className="bg-green-500">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {b.publishDate ? new Date(b.publishDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{b.views || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublish(b)}
                          title={b.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {b.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(b)} title="Delete">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Enter an attention-grabbing title"
              />
            </div>

            <div>
              <Label>Short Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief summary shown on the blog list (1-2 lines)"
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Publish Date</Label>
                <Input
                  type="date"
                  value={form.publishDate}
                  onChange={(e) => setForm(p => ({ ...p, publishDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Cover Image</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image ? (
                  <div className="relative">
                    <img src={form.image} alt="cover" className="w-32 h-20 rounded object-cover border" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, image: '' }))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-20 rounded border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm">
                    {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingCover ? 'Uploading...' : form.image ? 'Replace' : 'Upload Cover'}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Recommended: 1200 × 630 px. Max 10 MB.</p>
            </div>

            <div>
              <Label>Content *</Label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm(p => ({ ...p, content: html }))}
                placeholder="Start writing your blog post..."
              />
            </div>

            {/* ===== PDF ATTACHMENT ===== */}
            <div className="border rounded-lg p-4 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <Label className="flex items-center gap-2 text-base">
                    <FileDown className="w-4 h-4 text-brand-600" />
                    PDF Attachment
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Optionally attach a PDF. Users will see only the first page until they
                    log in and verify their phone number.
                  </p>
                </div>
              </div>

              {!editing?.id ? (
                <div className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded p-3">
                  Save the blog first — then you can attach a PDF from this dialog.
                </div>
              ) : editing?.pdfFileId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                    <div className="w-10 h-10 rounded bg-red-100 text-red-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {editing.pdfFileName || 'document.pdf'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {editing.pdfPageCount || 0} page{(editing.pdfPageCount || 0) === 1 ? '' : 's'}
                        {editing.pdfSize ? ` • ${(editing.pdfSize / 1024 / 1024).toFixed(2)} MB` : ''}
                      </div>
                    </div>
                    <a
                      href={`/api/pdfs/${editing.pdfPreviewFileId}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </a>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-gray-50">
                        {uploadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Replace
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={handlePdfUpload}
                        disabled={uploadingPdf}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handlePdfRemove}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={uploadingPdf}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-400 hover:bg-brand-50/40 transition-colors">
                  {uploadingPdf ? (
                    <><Loader2 className="w-5 h-5 animate-spin text-brand-600" /><span className="text-sm text-gray-600">Uploading & generating preview…</span></>
                  ) : (
                    <><Upload className="w-5 h-5 text-brand-600" /><span className="text-sm text-gray-700">Click to upload a PDF (max 25 MB)</span></>
                  )}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                  />
                </label>
              )}

              {/* Permission control */}
              {editing?.id && (
                <div className="mt-4 grid md:grid-cols-2 gap-3 items-end">
                  <div>
                    <Label className="flex items-center gap-2">
                      {form.pdfPermission === 'view_download' ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-600" />
                      )}
                      Access Permission
                    </Label>
                    <Select
                      value={form.pdfPermission || 'view'}
                      onValueChange={handlePermissionChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only (no download)</SelectItem>
                        <SelectItem value="view_download">View + Download</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500 pb-2">
                    Applies whenever a verified user opens the blog. You can change this at any time.
                  </p>
                </div>
              )}
            </div>
            {/* ===== END PDF ATTACHMENT ===== */}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> {editing ? 'Update Post' : 'Create Post'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====================== JOBS TAB ======================
function JobsTab() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const emptyForm = {
    title: '', organization: '', location: '', category: '',
    vacancies: '', salary: '', qualification: '', description: '',
    applyLink: '', lastDate: '', status: 'Active', pdfPermission: 'view'
  };
  const [form, setForm] = useState(emptyForm);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/jobs', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setJobs(d.data || []);
    } catch (e) { toast.error('Failed to load jobs'); }
    setLoading(false);
  };
  useEffect(() => { fetchJobs(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (j) => {
    setEditing(j);
    setForm({
      title: j.title || '', organization: j.organization || '', location: j.location || '',
      category: j.category || '', vacancies: j.vacancies ?? '',
      salary: j.salary || '', qualification: j.qualification || '',
      description: j.description || '', applyLink: j.applyLink || '',
      lastDate: j.lastDate ? String(j.lastDate).slice(0, 10) : '',
      status: j.status || 'Active',
      pdfPermission: j.pdfPermission || 'view'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.organization.trim()) { toast.error('Organization is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        vacancies: form.vacancies === '' ? 0 : parseInt(form.vacancies),
        pdfPermission: form.pdfPermission || 'view'
      };
      const url = editing ? `/api/admin/jobs/${editing.id}` : '/api/admin/jobs';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        toast.success(editing ? 'Job updated' : 'Job created');
        // Keep dialog open after CREATE so admin can attach a PDF immediately.
        if (!editing) {
          setEditing(d.data);
        } else {
          setEditing(d.data);
        }
        fetchJobs();
      } else toast.error(d.error || 'Save failed');
    } catch (e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (j) => {
    if (!confirm(`Delete "${j.title}"?`)) return;
    const res = await fetch(`/api/admin/jobs/${j.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('Job deleted'); fetchJobs(); } else toast.error('Delete failed');
  };

  // ---- PDF Handlers ----
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!editing?.id) {
      toast.error('Save the job first, then attach a PDF.');
      e.target.value = '';
      return;
    }
    if (!/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name || '')) {
      toast.error('Please select a PDF file');
      e.target.value = '';
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('PDF too large (max 25 MB)');
      e.target.value = '';
      return;
    }
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('permission', form.pdfPermission || 'view');

      const res = await fetch(`/api/admin/jobs/${editing.id}/upload-pdf`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      });
      const d = await res.json();
      if (d.success) {
        setEditing(d.data);
        setForm((p) => ({ ...p, pdfPermission: d.data.pdfPermission || 'view' }));
        toast.success('PDF uploaded successfully');
        fetchJobs();
      } else {
        toast.error(d.error || 'PDF upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('PDF upload failed');
    }
    setUploadingPdf(false);
    e.target.value = '';
  };

  const handlePdfRemove = async () => {
    if (!editing?.id) return;
    if (!confirm('Remove the attached PDF? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/jobs/${editing.id}/upload-pdf`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const d = await res.json();
      if (d.success) {
        setEditing(d.data);
        toast.success('PDF removed');
        fetchJobs();
      } else {
        toast.error(d.error || 'Failed to remove PDF');
      }
    } catch (e) {
      toast.error('Failed to remove PDF');
    }
  };

  const handlePermissionChange = async (newValue) => {
    setForm((p) => ({ ...p, pdfPermission: newValue }));
    // Persist immediately if editing an existing job with a PDF
    if (editing?.id && editing?.pdfFileId) {
      try {
        const res = await fetch(`/api/admin/jobs/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ pdfPermission: newValue })
        });
        const d = await res.json();
        if (d.success) {
          setEditing(d.data);
          toast.success('PDF permission updated');
          fetchJobs();
        }
      } catch (e) { /* ignore */ }
    }
  };

  const filtered = jobs.filter(j => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (search && !(j.title || '').toLowerCase().includes(search.toLowerCase())
        && !(j.organization || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
          <p className="text-sm text-gray-500">Manage job listings shown on the Jobs page</p>
        </div>
        <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700">
          <Plus className="w-4 h-4 mr-2" /> New Job
        </Button>
      </div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by title or organization..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{jobs.length === 0 ? 'No jobs yet. Click "New Job" to create one.' : 'No jobs match your filters.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Vacancies</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>Last Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell>{j.organization}</TableCell>
                    <TableCell className="text-sm text-gray-600">{j.location || '—'}</TableCell>
                    <TableCell>{j.vacancies ?? '—'}</TableCell>
                    <TableCell>
                      {j.pdfFileId ? (
                        <Badge variant="outline" className="text-xs gap-1">
                          <FileDown className="w-3 h-3" />
                          {j.pdfPermission === 'view_download' ? 'View+DL' : 'View'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{j.lastDate ? String(j.lastDate).slice(0, 10) : '—'}</TableCell>
                    <TableCell>
                      <Badge className={j.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{j.status || 'Active'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(j)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(j)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Job' : 'Create New Job'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Organization *</Label><Input value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} /></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Banking, Technical" /></div>
              <div><Label>Vacancies</Label><Input type="number" min="0" value={form.vacancies} onChange={e => setForm(p => ({ ...p, vacancies: e.target.value }))} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Salary</Label><Input value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. ₹50,000 - ₹70,000" /></div>
              <div><Label>Qualification</Label><Input value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><Label>Last Date</Label><Input type="date" value={form.lastDate} onChange={e => setForm(p => ({ ...p, lastDate: e.target.value }))} /></div>
              <div><Label>Apply Link</Label><Input value={form.applyLink} onChange={e => setForm(p => ({ ...p, applyLink: e.target.value }))} placeholder="https://..." /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ===== PDF ATTACHMENT ===== */}
            <div className="border rounded-lg p-4 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <Label className="flex items-center gap-2 text-base">
                    <FileDown className="w-4 h-4 text-brand-600" />
                    PDF Attachment
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Optionally attach a PDF (job notification, syllabus, etc.). Logged-in users can view.
                    Choose whether they can also download it.
                  </p>
                </div>
              </div>

              {!editing?.id ? (
                <div className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded p-3">
                  Save the job first — then you can attach a PDF from this dialog.
                </div>
              ) : editing?.pdfFileId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                    <div className="w-10 h-10 rounded bg-red-100 text-red-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {editing.pdfFileName || 'document.pdf'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {editing.pdfPageCount || 0} page{(editing.pdfPageCount || 0) === 1 ? '' : 's'}
                        {editing.pdfSize ? ` • ${(editing.pdfSize / 1024 / 1024).toFixed(2)} MB` : ''}
                      </div>
                    </div>
                    <a
                      href={`/api/pdfs/${editing.pdfPreviewFileId}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </a>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-gray-50">
                        {uploadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Replace
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={handlePdfUpload}
                        disabled={uploadingPdf}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handlePdfRemove}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={uploadingPdf}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-400 hover:bg-brand-50/40 transition-colors">
                  {uploadingPdf ? (
                    <><Loader2 className="w-5 h-5 animate-spin text-brand-600" /><span className="text-sm text-gray-600">Uploading & generating preview…</span></>
                  ) : (
                    <><Upload className="w-5 h-5 text-brand-600" /><span className="text-sm text-gray-700">Click to upload a PDF (max 25 MB)</span></>
                  )}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                  />
                </label>
              )}

              {/* Permission control */}
              {editing?.id && (
                <div className="mt-4 grid md:grid-cols-2 gap-3 items-end">
                  <div>
                    <Label className="flex items-center gap-2">
                      {form.pdfPermission === 'view_download' ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-600" />
                      )}
                      Access Permission
                    </Label>
                    <Select
                      value={form.pdfPermission || 'view'}
                      onValueChange={handlePermissionChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only (no download)</SelectItem>
                        <SelectItem value="view_download">View + Download</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500 pb-2">
                    Applies whenever a logged-in user opens the job. You can change this at any time.
                  </p>
                </div>
              )}
            </div>
            {/* ===== END PDF ATTACHMENT ===== */}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> {editing ? 'Update' : 'Create'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====================== COLLEGES TAB ======================
function CollegesTab() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = {
    name: '', location: '', ranking: '', type: 'Government',
    courses: '', fees: '', rating: '', acceptedExams: '',
    description: '', website: '', image: ''
  };
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/colleges', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setColleges(d.data || []);
    } catch (e) { toast.error('Failed to load colleges'); }
    setLoading(false);
  };
  useEffect(() => { fetchColleges(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || '', location: c.location || '',
      ranking: c.ranking ?? '', type: c.type || 'Government',
      courses: Array.isArray(c.courses) ? c.courses.join(', ') : (c.courses || ''),
      fees: c.fees || '', rating: c.rating ?? '',
      acceptedExams: Array.isArray(c.acceptedExams) ? c.acceptedExams.join(', ') : (c.acceptedExams || ''),
      description: c.description || '', website: c.website || '', image: c.image || ''
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image too large (max 10MB)'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: ev.target.result, filename: file.name })
        });
        const d = await res.json();
        if (d.success) { setForm(p => ({ ...p, image: d.data.url })); toast.success('Image uploaded'); }
        else toast.error(d.error || 'Upload failed');
      } catch (err) { toast.error('Upload failed'); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/colleges/${editing.id}` : '/api/admin/colleges';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(form)
      });
      const d = await res.json();
      if (d.success) { toast.success(editing ? 'College updated' : 'College created'); setDialogOpen(false); fetchColleges(); }
      else toast.error(d.error || 'Save failed');
    } catch (e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    const res = await fetch(`/api/admin/colleges/${c.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('College deleted'); fetchColleges(); } else toast.error('Delete failed');
  };

  const filtered = colleges.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Colleges</h2>
          <p className="text-sm text-gray-500">Manage colleges shown in the college finder</p>
        </div>
        <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700"><Plus className="w-4 h-4 mr-2" /> New College</Button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by name or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Building className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{colleges.length === 0 ? 'No colleges yet.' : 'No matches.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.image ? <img src={c.image} className="w-10 h-10 rounded object-cover" alt="" /> :
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><Building className="w-5 h-5 text-gray-400" /></div>}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{c.location || '—'}</TableCell>
                    <TableCell>{c.ranking ?? '—'}</TableCell>
                    <TableCell>{c.type || '—'}</TableCell>
                    <TableCell>{c.rating ? <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {c.rating}</span> : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit College' : 'Create New College'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, State" /></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><Label>Ranking</Label><Input type="number" min="1" value={form.ranking} onChange={e => setForm(p => ({ ...p, ranking: e.target.value }))} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Deemed">Deemed</SelectItem>
                    <SelectItem value="Autonomous">Autonomous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Rating (0-5)</Label><Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Fees</Label><Input value={form.fees} onChange={e => setForm(p => ({ ...p, fees: e.target.value }))} placeholder="e.g. ₹2,00,000/year" /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." /></div>
            </div>
            <div><Label>Courses (comma-separated)</Label><Input value={form.courses} onChange={e => setForm(p => ({ ...p, courses: e.target.value }))} placeholder="B.Tech, M.Tech, Ph.D" /></div>
            <div><Label>Accepted Exams (comma-separated)</Label><Input value={form.acceptedExams} onChange={e => setForm(p => ({ ...p, acceptedExams: e.target.value }))} placeholder="JEE Advanced, GATE" /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div>
              <Label>College Image/Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image ? (
                  <div className="relative">
                    <img src={form.image} className="w-24 h-16 rounded object-cover border" alt="" />
                    <button type="button" onClick={() => setForm(p => ({ ...p, image: '' }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="w-24 h-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"><ImageIcon className="w-5 h-5 text-gray-400" /></div>
                )}
                <label className="cursor-pointer">
                  <div className="px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : form.image ? 'Replace' : 'Upload'}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> {editing ? 'Update' : 'Create'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====================== TESTIMONIALS TAB ======================
function TestimonialsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = { name: '', exam: '', rank: '', image: '', testimonial: '', rating: 5 };
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setItems(d.data || []);
    } catch (e) { toast.error('Failed to load testimonials'); }
    setLoading(false);
  };
  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name || '', exam: t.exam || '', rank: t.rank || '',
      image: t.image || '', testimonial: t.testimonial || '',
      rating: t.rating ?? 5
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image too large'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: ev.target.result, filename: file.name })
        });
        const d = await res.json();
        if (d.success) { setForm(p => ({ ...p, image: d.data.url })); toast.success('Image uploaded'); }
        else toast.error(d.error || 'Upload failed');
      } catch (err) { toast.error('Upload failed'); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.testimonial.trim()) { toast.error('Testimonial is required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/testimonials/${editing.id}` : '/api/admin/testimonials';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(form)
      });
      const d = await res.json();
      if (d.success) { toast.success(editing ? 'Testimonial updated' : 'Testimonial created'); setDialogOpen(false); fetchItems(); }
      else toast.error(d.error || 'Save failed');
    } catch (e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete testimonial from "${t.name}"?`)) return;
    const res = await fetch(`/api/admin/testimonials/${t.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('Testimonial deleted'); fetchItems(); } else toast.error('Delete failed');
  };

  const filtered = items.filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.exam || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Testimonials</h2>
          <p className="text-sm text-gray-500">Manage student testimonials shown on the homepage</p>
        </div>
        <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700"><Plus className="w-4 h-4 mr-2" /> New Testimonial</Button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by name or exam..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{items.length === 0 ? 'No testimonials yet.' : 'No matches.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Testimonial</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {t.image ? <img src={t.image} className="w-10 h-10 rounded-full object-cover" alt="" /> :
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">{(t.name || '?').charAt(0).toUpperCase()}</div>}
                    </TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{t.exam || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{t.rank || '—'}</TableCell>
                    <TableCell>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-3 h-3 ${n <= (t.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">{t.testimonial}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Testimonial' : 'Create New Testimonial'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Exam</Label><Input value={form.exam} onChange={e => setForm(p => ({ ...p, exam: e.target.value }))} placeholder="e.g. GATE 2024" /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Rank / Achievement</Label><Input value={form.rank} onChange={e => setForm(p => ({ ...p, rank: e.target.value }))} placeholder="e.g. AIR 156" /></div>
              <div>
                <Label>Rating</Label>
                <Select value={String(form.rating)} onValueChange={v => setForm(p => ({ ...p, rating: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n}/5)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Photo</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image ? (
                  <div className="relative">
                    <img src={form.image} className="w-16 h-16 rounded-full object-cover border" alt="" />
                    <button type="button" onClick={() => setForm(p => ({ ...p, image: '' }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"><ImageIcon className="w-5 h-5 text-gray-400" /></div>
                )}
                <label className="cursor-pointer">
                  <div className="px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : form.image ? 'Replace' : 'Upload Photo'}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
            </div>
            <div>
              <Label>Testimonial *</Label>
              <Textarea rows={4} value={form.testimonial} onChange={e => setForm(p => ({ ...p, testimonial: e.target.value }))} placeholder="What the student said about Unishaala..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> {editing ? 'Update' : 'Create'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====================== CONTACT LEADS TAB ======================
function ContactsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ status: 'New', notes: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contacts', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setItems(d.data || []);
    } catch (e) { toast.error('Failed to load contacts'); }
    setLoading(false);
  };
  useEffect(() => { fetchItems(); }, []);

  const openDetail = (c) => { setActive(c); setDetailOpen(true); };
  const openEdit = (c) => {
    setActive(c);
    setForm({ status: c.status || 'New', notes: c.notes || '' });
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contacts/${active.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(form)
      });
      const d = await res.json();
      if (d.success) { toast.success('Lead updated'); setEditOpen(false); fetchItems(); }
      else toast.error(d.error || 'Update failed');
    } catch (e) { toast.error('Update failed'); }
    setSaving(false);
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete lead from "${c.name}"?`)) return;
    const res = await fetch(`/api/admin/contacts/${c.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('Lead deleted'); fetchItems(); } else toast.error('Delete failed');
  };

  const statusBadge = (s) => {
    const map = { New: 'bg-blue-500', Contacted: 'bg-amber-500', Resolved: 'bg-green-500', Spam: 'bg-gray-500' };
    return <Badge className={map[s] || 'bg-blue-500'}>{s || 'New'}</Badge>;
  };

  const filtered = items.filter(c => {
    if (statusFilter !== 'all' && (c.status || 'New') !== statusFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return [c.name, c.email, c.phone, c.subject, c.message]
      .some(v => String(v || '').toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Leads</h2>
          <p className="text-sm text-gray-500">View and manage messages submitted via the Contact form</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by name, email, phone, subject..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Spam">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{items.length === 0 ? 'No contact leads yet.' : 'No matches.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetail(c)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm"><a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="text-brand-600 hover:underline">{c.email}</a></TableCell>
                    <TableCell className="text-sm text-gray-600">{c.phone || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">{c.subject || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[220px] truncate">{c.message}</TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Contact Lead Details</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-gray-500">Name</span>
                <span className="col-span-2 font-medium">{active.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-gray-500">Email</span>
                <span className="col-span-2"><a className="text-brand-600 hover:underline" href={`mailto:${active.email}`}>{active.email}</a></span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="col-span-2">{active.phone ? <a className="text-brand-600 hover:underline" href={`tel:${active.phone}`}>{active.phone}</a> : '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-gray-500">Subject</span>
                <span className="col-span-2">{active.subject || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-gray-500">Message</span>
                <div className="col-span-2 whitespace-pre-wrap bg-gray-50 border rounded p-3 text-gray-800">{active.message}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-gray-500">Status</span>
                <span className="col-span-2">{statusBadge(active.status)}</span>
              </div>
              {active.notes && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-gray-500">Notes</span>
                  <div className="col-span-2 whitespace-pre-wrap bg-amber-50 border border-amber-200 rounded p-3">{active.notes}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                <span>Received</span>
                <span className="col-span-2">{active.createdAt ? new Date(active.createdAt).toLocaleString() : '—'}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            {active && (
              <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => { setDetailOpen(false); openEdit(active); }}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog (status + notes) */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!saving) setEditOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Update Lead</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Spam">Spam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Internal Notes</Label>
              <Textarea rows={4} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Add notes about follow-up, outcome, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Update</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====================== ANSWER KEYS TAB ======================
function AnswerKeysTab() {
  const [keys, setKeys] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = { title: '', description: '', examId: 'none', positiveMarks: 1, negativeMarks: 0.33 };
  const [form, setForm] = useState(emptyForm);
  const [csvText, setCsvText] = useState('');
  const [csvUploading, setCsvUploading] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const [keysRes, examsRes, subsRes] = await Promise.all([
        fetch('/api/admin/answer-keys', { credentials: 'include' }),
        fetch('/api/admin/exams', { credentials: 'include' }),
        fetch('/api/admin/rank-predictions', { credentials: 'include' })
      ]);
      const kd = await keysRes.json();
      const ed = await examsRes.json();
      const sd = await subsRes.json();
      if (kd.success) setKeys(kd.data || []);
      if (ed.success) setExams(ed.data || []);
      if (sd.success) setSubmissions(sd.data || []);
    } catch (e) { toast.error('Failed to load answer keys'); }
    setLoading(false);
  };
  useEffect(() => { fetchKeys(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (k) => {
    setEditing(k);
    setForm({
      title: k.title || '',
      description: k.description || '',
      examId: k.examId || 'none',
      positiveMarks: k.positiveMarks ?? 1,
      negativeMarks: k.negativeMarks ?? 0.33
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        examId: form.examId === 'none' ? null : form.examId,
        positiveMarks: parseFloat(form.positiveMarks),
        negativeMarks: parseFloat(form.negativeMarks)
      };
      const url = editing ? `/api/admin/answer-keys/${editing.id}` : '/api/admin/answer-keys';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        toast.success(editing ? 'Answer key updated' : 'Answer key created');
        setDialogOpen(false);
        // If just created (no answers yet), open CSV upload
        if (!editing) {
          setActive(d.data);
          setCsvText('');
          setCsvDialogOpen(true);
        }
        fetchKeys();
      } else toast.error(d.error || 'Save failed');
    } catch (e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (k) => {
    if (!confirm(`Delete "${k.title}"? All associated rank submissions will also be deleted.`)) return;
    const res = await fetch(`/api/admin/answer-keys/${k.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('Answer key deleted'); fetchKeys(); } else toast.error('Delete failed');
  };

  const openCsvUpload = (k) => { setActive(k); setCsvText(''); setCsvDialogOpen(true); };
  const openView = (k) => { setActive(k); setViewDialogOpen(true); };

  const handleCsvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCsvText(ev.target.result); };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvUpload = async () => {
    if (!csvText.trim()) { toast.error('Please paste or upload CSV content'); return; }
    setCsvUploading(true);
    try {
      const res = await fetch(`/api/admin/answer-keys/${active.id}/upload-csv`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ csv: csvText })
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Imported ${d.stats.imported} answers${d.stats.errors.length ? ` (${d.stats.errors.length} errors)` : ''}`);
        if (d.stats.errors.length > 0) console.warn('CSV errors:', d.stats.errors);
        setCsvDialogOpen(false);
        fetchKeys();
      } else toast.error(d.error || 'Upload failed');
    } catch (e) { toast.error('Upload failed'); }
    setCsvUploading(false);
  };

  const filtered = keys.filter(k => (k.title || '').toLowerCase().includes(search.toLowerCase()));

  const countSubsFor = (id) => submissions.filter(s => s.answerKeyId === id).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Answer Key Management</h2>
          <p className="text-sm text-gray-500">Create answer keys and configure marking scheme for rank prediction</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/rank-predictor/sample-csv" download>
            <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Sample CSV</Button>
          </a>
          <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="w-4 h-4 mr-2" /> New Answer Key
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{keys.length === 0 ? 'No answer keys yet. Create one to start.' : 'No matches.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Linked Exam</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Marking</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((k) => {
                  const exam = exams.find(e => e.id === k.examId);
                  return (
                    <TableRow key={k.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{k.title}</div>
                        {k.description && <div className="text-xs text-gray-500 line-clamp-1">{k.description}</div>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{exam?.name || '—'}</TableCell>
                      <TableCell>
                        {k.totalQuestions > 0 ? (
                          <Badge className="bg-brand-100 text-brand-700">{k.totalQuestions}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">No CSV</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <span className="text-green-600">+{k.positiveMarks}</span>
                        {' / '}
                        <span className="text-red-600">−{k.negativeMarks}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{countSubsFor(k.id)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openView(k)} title="View"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openCsvUpload(k)} title="Upload CSV"><Upload className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(k)} title="Edit"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(k)} title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Answer Key' : 'Create New Answer Key'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. GATE CS 2024 (Set 1)" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description shown to users" />
            </div>
            <div>
              <Label>Linked Test Series (optional)</Label>
              <Select value={form.examId} onValueChange={v => setForm(p => ({ ...p, examId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Positive Marks *</Label>
                <Input type="number" step="0.01" value={form.positiveMarks} onChange={e => setForm(p => ({ ...p, positiveMarks: e.target.value }))} placeholder="e.g. 1" />
                <p className="text-xs text-gray-500 mt-1">Awarded for each correct answer.</p>
              </div>
              <div>
                <Label>Negative Marks *</Label>
                <Input type="number" step="0.01" value={form.negativeMarks} onChange={e => setForm(p => ({ ...p, negativeMarks: e.target.value }))} placeholder="e.g. 0.33" />
                <p className="text-xs text-gray-500 mt-1">Deducted for each wrong answer (positive value).</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> {editing ? 'Update' : 'Create & Continue'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={(o) => { if (!csvUploading) setCsvDialogOpen(o); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Answer Key CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-brand-50 border border-brand-200 rounded-md p-3 text-sm text-brand-900">
              <p className="font-medium mb-1">Expected CSV format:</p>
              <pre className="bg-white border rounded p-2 text-xs overflow-auto">question_id,correct_answer{'\n'}6420084710,C           <span className="text-gray-500">← MCQ (single)</span>{'\n'}"6420084732","B,D"     <span className="text-gray-500">← MSQ (multi, quoted)</span>{'\n'}6420084736,16.5-16.8    <span className="text-gray-500">← Range</span>{'\n'}6420084740,12.5         <span className="text-gray-500">← NAT (numeric)</span>{'\n'}6420084750,MAT          <span className="text-gray-500">← Bonus</span></pre>
              <ul className="text-xs mt-2 space-y-0.5 list-disc ml-5">
                <li><strong>MCQ</strong>: single letter A-D</li>
                <li><strong>MSQ</strong>: multiple letters — <em>quote the answer</em> like <code>"B,D"</code></li>
                <li><strong>NAT</strong>: numeric value (±0.01 tolerance)</li>
                <li><strong>Range</strong>: <code>lo-hi</code> format (e.g. <code>16.5-16.8</code>)</li>
                <li><strong>MAT</strong>: bonus — credit if attempted</li>
              </ul>
              <a href="/api/rank-predictor/sample-csv" download className="inline-flex items-center text-brand-700 hover:underline text-xs mt-2">
                <Download className="w-3 h-3 mr-1" /> Download sample CSV
              </a>
            </div>
            <div>
              <Label>Upload CSV File</Label>
              <Input type="file" accept=".csv,text/csv" onChange={handleCsvFile} />
            </div>
            <div>
              <Label>OR Paste CSV Content</Label>
              <Textarea rows={8} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="Paste CSV content here..." className="font-mono text-sm" />
            </div>
            {active && (
              <p className="text-xs text-gray-500">This will <span className="font-semibold">replace</span> the existing answers on "{active.title}".</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)} disabled={csvUploading}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleCsvUpload} disabled={csvUploading || !csvText.trim()}>
              {csvUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Import CSV</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Answers Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{active?.title || 'Answer Key'}</DialogTitle></DialogHeader>
          {active && (
            <div className="py-2">
              <div className="grid md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-500">Questions</p>
                  <p className="text-xl font-bold">{active.totalQuestions || 0}</p>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <p className="text-xs text-gray-500">Positive marks</p>
                  <p className="text-xl font-bold text-green-600">+{active.positiveMarks}</p>
                </div>
                <div className="bg-red-50 rounded p-3">
                  <p className="text-xs text-gray-500">Negative marks</p>
                  <p className="text-xl font-bold text-red-600">−{active.negativeMarks}</p>
                </div>
                <div className="bg-brand-50 rounded p-3">
                  <p className="text-xs text-gray-500">Submissions</p>
                  <p className="text-xl font-bold text-brand-600">{countSubsFor(active.id)}</p>
                </div>
              </div>
              {active.answers && active.answers.length > 0 ? (
                <div className="border rounded">
                  <div className="max-h-80 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Question ID</TableHead><TableHead>Correct Answer</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {active.answers.map((a, i) => (
                          <TableRow key={i}><TableCell className="font-mono">Q{a.question_id}</TableCell><TableCell className="font-mono">{a.correct_answer}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded p-8 text-center">
                  <p className="text-gray-500 mb-3">No answers uploaded yet.</p>
                  <Button onClick={() => { setViewDialogOpen(false); openCsvUpload(active); }} className="bg-brand-600 hover:bg-brand-700">
                    <Upload className="w-4 h-4 mr-2" /> Upload CSV
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        const d = await res.json();
        if (d.success) setStats(d.data);
      } else if (activeTab === 'tests') {
        // Fetch both exams and mock tests
        const [examsRes, testsRes] = await Promise.all([
          fetch('/api/admin/exams', { credentials: 'include' }),
          fetch('/api/admin/mock-tests', { credentials: 'include' })
        ]);
        const examsData = await examsRes.json();
        const testsData = await testsRes.json();
        if (examsData.success) setData(p => ({ ...p, exams: examsData.data }));
        if (testsData.success) setData(p => ({ ...p, mockTests: testsData.data }));
      } else if (activeTab === 'questions') {
        // Fetch both exams and mock tests for questions tab
        const [examsRes, testsRes] = await Promise.all([
          fetch('/api/admin/exams', { credentials: 'include' }),
          fetch('/api/admin/mock-tests', { credentials: 'include' })
        ]);
        const examsData = await examsRes.json();
        const testsData = await testsRes.json();
        if (examsData.success) setData(p => ({ ...p, exams: examsData.data }));
        if (testsData.success) setData(p => ({ ...p, mockTests: testsData.data }));
      } else if (activeTab === 'exams') {
        const res = await fetch('/api/admin/exams', { credentials: 'include' });
        const d = await res.json();
        if (d.success) setData(p => ({ ...p, exams: d.data }));
      } else if (activeTab === 'notifications') {
        // Need exams for the Exam dropdown in the notification dialog
        const [examsRes, notifsRes] = await Promise.all([
          fetch('/api/admin/exams', { credentials: 'include' }),
          fetch('/api/admin/notifications', { credentials: 'include' })
        ]);
        const examsData = await examsRes.json();
        const notifsData = await notifsRes.json();
        if (examsData.success) setData(p => ({ ...p, exams: examsData.data }));
        if (notifsData.success) setData(p => ({ ...p, notifications: notifsData.data }));
      } else {
        const endpoints = { jobs: '/api/admin/jobs', colleges: '/api/admin/colleges', users: '/api/admin/users', testimonials: '/api/admin/testimonials', contacts: '/api/admin/contacts' };
        const endpoint = endpoints[activeTab];
        if (endpoint) {
          const res = await fetch(endpoint, { credentials: 'include' });
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
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
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

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} />
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
          {activeTab === 'domains' && <DomainsTab exams={data.exams} onRefresh={fetchData} />}
          {activeTab === 'subjects' && <SubjectsTab exams={data.exams} />}
          {activeTab === 'tests' && <TestsTab mockTests={data.mockTests} exams={data.exams} onRefresh={fetchData} />}
          {activeTab === 'questions' && <QuestionsTab mockTests={data.mockTests} exams={data.exams} onRefresh={fetchData} />}
          {activeTab === 'reviewer' && <ReviewerTab userRole={user.role} />}
          {activeTab === 'creative' && <CreativeControlTab />}
          {activeTab === 'blogs' && <BlogsTab />}
          {activeTab === 'notes' && <NotesTab exams={data.exams} />}
          {activeTab === 'notifications' && <NotificationsTab exams={data.exams} />}
          {activeTab === 'pricing' && <PricingTab exams={data.exams} />}
          {activeTab === 'answer-keys' && <AnswerKeysTab />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'jobs' && <JobsTab />}
          {activeTab === 'colleges' && <CollegesTab />}
          {activeTab === 'users' && <CRUDTable title="Users" data={data.users} columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'phoneVerified', label: 'Phone Verified', render: v => v ? <Badge className="bg-green-500">✓ Verified</Badge> : <Badge className="bg-gray-400">Not Verified</Badge> }, { key: 'authProvider', label: 'Auth', render: v => <Badge variant="outline">{v === 'google' ? '🔵 Google' : '📧 Email'}</Badge> }, { key: 'role', label: 'Role', render: v => <Badge>{v}</Badge> }]} loading={loading} />}
          {activeTab === 'testimonials' && <TestimonialsTab />}
          {activeTab === 'contacts' && <ContactsTab />}
        </main>
      </div>
    </div>
  );
}

// ====================== SUBJECTS TAB ======================
function SubjectsTab({ exams }) {
  const [subjects, setSubjects] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExamId, setFilterExamId] = useState('');
  const [filterDomainId, setFilterDomainId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = { name: '', description: '', examId: '', domainId: '', status: 'Active' };
  const [form, setForm] = useState(emptyForm);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch('/api/admin/subjects', { credentials: 'include' }),
        fetch('/api/admin/domains', { credentials: 'include' })
      ]);
      const s = await sRes.json();
      const d = await dRes.json();
      if (s.success) setSubjects(s.data || []);
      if (d.success) setDomains(d.data || []);
    } catch (_e) { toast.error('Failed to load subjects'); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const formDomains = domains.filter(d => d.examId === form.examId);
  const filtered = subjects.filter(s => {
    if (filterExamId && s.examId !== filterExamId) return false;
    if (filterDomainId && s.domainId !== filterDomainId) return false;
    return true;
  });

  const examName = (id) => exams?.find(e => e.id === id)?.name || '—';
  const domainName = (id) => domains.find(d => d.id === id)?.name || '—';

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name || '', description: s.description || '',
      examId: s.examId || '', domainId: s.domainId || '',
      status: s.status || 'Active'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.examId) { toast.error('Select an exam'); return; }
    if (!form.domainId) { toast.error('Select a domain'); return; }
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/subjects/${editing.id}` : '/api/admin/subjects';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (d.success) {
        toast.success(editing ? 'Subject updated' : 'Subject created');
        setDialogOpen(false);
        fetchAll();
      } else toast.error(d.error || 'Save failed');
    } catch (_e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete subject "${s.name}"? Any practice tests using it will lose their subject mapping.`)) return;
    const res = await fetch(`/api/admin/subjects/${s.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('Subject deleted'); fetchAll(); } else toast.error('Delete failed');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subjects</h2>
          <p className="text-sm text-gray-500">Subjects are used by Practice Question tests. Create one per (Exam, Domain).</p>
        </div>
        <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700">
          <Plus className="w-4 h-4 mr-2" /> New Subject
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Select value={filterExamId || 'all'} onValueChange={v => { setFilterExamId(v === 'all' ? '' : v); setFilterDomainId(''); }}>
          <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Filter by exam" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDomainId || 'all'} onValueChange={v => setFilterDomainId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Filter by domain" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {domains.filter(d => !filterExamId || d.examId === filterExamId).map(d =>
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No subjects yet. Click &quot;New Subject&quot; to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{examName(s.examId)}</TableCell>
                    <TableCell>{domainName(s.domainId)}</TableCell>
                    <TableCell>
                      <Badge className={s.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>{s.status || 'Active'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Subject' : 'Create Subject'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Exam *</Label>
              <Select value={form.examId} onValueChange={v => setForm(p => ({ ...p, examId: v, domainId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {exams?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.examId && (
              <div>
                <Label>Domain *</Label>
                <Select value={form.domainId} onValueChange={v => setForm(p => ({ ...p, domainId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>
                    {formDomains.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Algebra, Quantitative Aptitude" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-2" /> {editing ? 'Update' : 'Create'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// =========================== NOTES TAB ===========================
function NotesTab({ exams }) {
  const [notes, setNotes] = useState([]);
  const [domains, setDomains] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExamId, setFilterExamId] = useState('');
  const [filterDomainId, setFilterDomainId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = { title: '', description: '', examId: '', domainId: '', subjectId: '', pdfPermission: 'view', status: 'Active' };
  const [form, setForm] = useState(emptyForm);

  // PDF upload state
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfTarget, setPdfTarget] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPermission, setPdfPermission] = useState('view');
  const [uploading, setUploading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [nRes, dRes, sRes] = await Promise.all([
        fetch('/api/admin/notes', { credentials: 'include' }),
        fetch('/api/admin/domains', { credentials: 'include' }),
        fetch('/api/admin/subjects', { credentials: 'include' })
      ]);
      const n = await nRes.json();
      const d = await dRes.json();
      const s = await sRes.json();
      if (n.success) setNotes(n.data || []);
      if (d.success) setDomains(d.data || []);
      if (s.success) setSubjects(s.data || []);
    } catch (_e) { toast.error('Failed to load notes'); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const formDomains = domains.filter(d => d.examId === form.examId);
  const formSubjects = subjects.filter(s => s.examId === form.examId && s.domainId === form.domainId);

  const filtered = notes.filter(n => {
    if (filterExamId && n.examId !== filterExamId) return false;
    if (filterDomainId && n.domainId !== filterDomainId) return false;
    if (filterSubjectId && n.subjectId !== filterSubjectId) return false;
    return true;
  });

  const examName = (id) => exams?.find(e => e.id === id)?.name || '—';
  const domainName = (id) => domains.find(d => d.id === id)?.name || '—';
  const subjectName = (id) => subjects.find(s => s.id === id)?.name || '—';

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (n) => {
    setEditing(n);
    setForm({
      title: n.title || '', description: n.description || '',
      examId: n.examId || '', domainId: n.domainId || '', subjectId: n.subjectId || '',
      pdfPermission: n.pdfPermission || 'view',
      status: n.status || 'Active'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.examId) { toast.error('Select an exam'); return; }
    if (!form.domainId) { toast.error('Select a domain'); return; }
    if (!form.subjectId) { toast.error('Select a subject'); return; }
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/notes/${editing.id}` : '/api/admin/notes';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (d.success) {
        toast.success(editing ? 'Note updated' : 'Note created');
        setDialogOpen(false);
        fetchAll();
      } else toast.error(d.error || 'Save failed');
    } catch (_e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (n) => {
    if (!confirm(`Delete note "${n.title}"? The attached PDF will also be removed.`)) return;
    const res = await fetch(`/api/admin/notes/${n.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('Note deleted'); fetchAll(); } else toast.error('Delete failed');
  };

  const openPdfUpload = (n) => {
    setPdfTarget(n);
    setPdfFile(null);
    setPdfPermission(n.pdfPermission || 'view');
    setPdfDialogOpen(true);
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) { toast.error('Choose a PDF file'); return; }
    if (!/\.pdf$/i.test(pdfFile.name) && !/pdf/i.test(pdfFile.type)) {
      toast.error('File must be a PDF'); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', pdfFile);
      fd.append('permission', pdfPermission);
      const res = await fetch(`/api/admin/notes/${pdfTarget.id}/upload-pdf`, {
        method: 'POST', credentials: 'include', body: fd
      });
      const d = await res.json();
      if (d.success) {
        toast.success('PDF uploaded');
        setPdfDialogOpen(false);
        fetchAll();
      } else toast.error(d.error || 'Upload failed');
    } catch (_e) { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handlePdfDelete = async (n) => {
    if (!confirm('Remove the attached PDF from this note?')) return;
    const res = await fetch(`/api/admin/notes/${n.id}/upload-pdf`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('PDF removed'); fetchAll(); } else toast.error('Failed');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notes</h2>
          <p className="text-sm text-gray-500">Upload study note PDFs. Users can browse them via Exam → Domain → Subject on the Notes page.</p>
        </div>
        <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700">
          <Plus className="w-4 h-4 mr-2" /> New Note
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Select value={filterExamId || 'all'} onValueChange={v => { setFilterExamId(v === 'all' ? '' : v); setFilterDomainId(''); setFilterSubjectId(''); }}>
          <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Filter by exam" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDomainId || 'all'} onValueChange={v => { setFilterDomainId(v === 'all' ? '' : v); setFilterSubjectId(''); }}>
          <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Filter by domain" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {domains.filter(d => !filterExamId || d.examId === filterExamId).map(d =>
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Select value={filterSubjectId || 'all'} onValueChange={v => setFilterSubjectId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Filter by subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.filter(s =>
              (!filterExamId || s.examId === filterExamId) &&
              (!filterDomainId || s.domainId === filterDomainId)
            ).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileDown className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No notes yet. Click &quot;New Note&quot; to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{n.title}</div>
                      {n.description && <div className="text-xs text-gray-500 truncate">{n.description}</div>}
                    </TableCell>
                    <TableCell>{examName(n.examId)}</TableCell>
                    <TableCell>{domainName(n.domainId)}</TableCell>
                    <TableCell>{subjectName(n.subjectId)}</TableCell>
                    <TableCell>
                      {n.pdfFileId ? (
                        <Badge className="bg-green-500 whitespace-nowrap">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {n.pdfPageCount ? `${n.pdfPageCount}p` : 'PDF'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300">No PDF</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {n.pdfPermission === 'view_download' ? (
                        <Badge className="bg-blue-600">View + Download</Badge>
                      ) : (
                        <Badge className="bg-gray-500">View only</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" title="Upload PDF" onClick={() => openPdfUpload(n)}>
                        <Upload className="w-4 h-4 text-brand-600" />
                      </Button>
                      {n.pdfFileId && (
                        <Button variant="ghost" size="sm" title="Remove PDF" onClick={() => handlePdfDelete(n)}>
                          <FileDown className="w-4 h-4 text-amber-600 rotate-180" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEdit(n)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(n)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Note' : 'Create Note'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Exam *</Label>
              <Select value={form.examId} onValueChange={v => setForm(p => ({ ...p, examId: v, domainId: '', subjectId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {exams?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.examId && (
              <div>
                <Label>Domain *</Label>
                <Select value={form.domainId} onValueChange={v => setForm(p => ({ ...p, domainId: v, subjectId: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>
                    {formDomains.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.domainId && (
              <div>
                <Label>Subject *</Label>
                <Select value={form.subjectId} onValueChange={v => setForm(p => ({ ...p, subjectId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {formSubjects.length === 0 ? (
                      <SelectItem value="__none__" disabled>No subjects — create one under Subjects tab</SelectItem>
                    ) : formSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Derivatives — Formulae Sheet" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short summary shown to users" />
            </div>
            <div>
              <Label>Access Permission</Label>
              <Select value={form.pdfPermission} onValueChange={v => setForm(p => ({ ...p, pdfPermission: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="view_download">View + Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <p className="text-xs text-gray-500">After creating the note, click the <Upload className="inline w-3 h-3" /> icon in the table to upload the PDF.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-2" /> {editing ? 'Update' : 'Create'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Upload Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={(o) => { if (!uploading) setPdfDialogOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Upload PDF for &quot;{pdfTarget?.title}&quot;</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>PDF file (max 25 MB)</Label>
              <Input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
              {pdfFile && <p className="text-xs text-gray-500 mt-1">{pdfFile.name} • {(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>
            <div>
              <Label>Access Permission</Label>
              <Select value={pdfPermission} onValueChange={setPdfPermission}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="view_download">View + Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pdfTarget?.pdfFileId && (
              <p className="text-xs text-amber-700">⚠ Replacing the existing PDF &quot;{pdfTarget.pdfFileName}&quot;</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)} disabled={uploading}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handlePdfUpload} disabled={uploading || !pdfFile}>
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =========================== EXAM NOTIFICATIONS TAB ===========================
function NotificationsTab({ exams }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = { title: '', examName: '', description: '', date: '', link: '', isNew: true };
  const [form, setForm] = useState(emptyForm);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/notifications', { credentials: 'include' });
      const d = await r.json();
      if (d.success) setItems(d.data || []);
    } catch (_e) { toast.error('Failed to load notifications'); }
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) }); setDialogOpen(true); };
  const openEdit = (n) => {
    setEditing(n);
    setForm({
      title: n.title || '', examName: n.examName || '',
      description: n.description || '', date: n.date || '',
      link: n.link || '', isNew: !!n.isNew,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/notifications/${editing.id}` : '/api/admin/notifications';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(form)
      });
      const d = await res.json();
      if (d.success) {
        toast.success(editing ? 'Notification updated' : 'Notification created');
        setDialogOpen(false);
        fetchAll();
      } else toast.error(d.error || 'Save failed');
    } catch (_e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (n) => {
    if (!confirm(`Delete notification "${n.title}"?`)) return;
    const res = await fetch(`/api/admin/notifications/${n.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) { toast.success('Notification deleted'); fetchAll(); } else toast.error('Delete failed');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Notifications</h2>
          <p className="text-sm text-gray-500">Create announcements shown on the home page marquee and the public /notifications page.</p>
        </div>
        <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700">
          <Plus className="w-4 h-4 mr-2" /> New Notification
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No notifications yet. Click &quot;New Notification&quot; to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium max-w-sm">
                      <div className="truncate">{n.title}</div>
                      {n.description && <div className="text-xs text-gray-500 truncate">{n.description}</div>}
                    </TableCell>
                    <TableCell>{n.examName || '—'}</TableCell>
                    <TableCell>{n.date || '—'}</TableCell>
                    <TableCell>
                      {n.isNew ? <Badge className="bg-brand-500">NEW</Badge> : <Badge variant="outline">—</Badge>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(n)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(n)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Notification' : 'Create Notification'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. JEE Main 2026 Session 1 Registration Open" />
            </div>
            <div>
              <Label>Exam</Label>
              <Select value={form.examName || '__none__'} onValueChange={v => setForm(p => ({ ...p, examName: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Pick an exam label" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {exams?.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Full details — dates, eligibility, other key points users should know." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <Label>External link</Label>
                <Input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://…" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isNew} onCheckedChange={v => setForm(p => ({ ...p, isNew: v }))} id="notif-new" />
              <Label htmlFor="notif-new" className="cursor-pointer">Show &quot;NEW&quot; badge</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-2" /> {editing ? 'Update' : 'Create'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// =========================== PRICING TAB ===========================
function PricingTab({ exams }) {
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState({ getPassPrice: 0, getPassEnabled: false, getPassDurationDays: 365 });
  const [savingPass, setSavingPass] = useState(false);
  const [domains, setDomains] = useState([]);
  const [rowSaving, setRowSaving] = useState({});

  // Structured selection state
  const [contentType, setContentType] = useState('mock_test'); // 'mock_test' | 'previous_year'
  const [section, setSection] = useState('exam'); // 'exam' | 'domain'
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [examPriceInput, setExamPriceInput] = useState('');
  const [domainPriceInput, setDomainPriceInput] = useState('');

  // Preset duration options
  const DURATION_OPTIONS = [
    { days: 30, label: '1 Month' },
    { days: 90, label: '3 Months' },
    { days: 180, label: '6 Months' },
    { days: 365, label: '1 Year' },
    { days: 730, label: '2 Years' },
    { days: 1825, label: '5 Years' },
  ];

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        fetch('/api/admin/pricing', { credentials: 'include' }),
        fetch('/api/admin/domains', { credentials: 'include' })
      ]);
      const p = await pRes.json();
      const d = await dRes.json();
      if (p.success) setPass({
        getPassPrice: p.data.getPassPrice || 0,
        getPassEnabled: !!p.data.getPassEnabled,
        getPassDurationDays: p.data.getPassDurationDays || 365,
      });
      if (d.success) setDomains(d.data || []);
    } catch (_e) { toast.error('Failed to load pricing'); }
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, [exams]);

  // Derive the "currently effective" price for the selected exam/domain/type
  const selectedExam = exams?.find(e => e.id === selectedExamId);
  const selectedDomain = domains.find(d => d.id === selectedDomainId);
  const examPriceField = contentType === 'previous_year' ? 'pyqPrice' : 'price';
  const domainPriceField = contentType === 'previous_year' ? 'pyqPrice' : 'price';

  // When the user changes exam/type, load its price into the input
  useEffect(() => {
    if (selectedExam) setExamPriceInput(String(selectedExam[examPriceField] || 0));
    else setExamPriceInput('');
  }, [selectedExamId, contentType, exams]);

  useEffect(() => {
    if (selectedDomain) setDomainPriceInput(String(selectedDomain[domainPriceField] || 0));
    else setDomainPriceInput('');
  }, [selectedDomainId, contentType, domains]);

  const savePass = async () => {
    setSavingPass(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          getPassPrice: pass.getPassPrice,
          getPassEnabled: pass.getPassEnabled,
          getPassDurationDays: pass.getPassDurationDays,
        })
      });
      const d = await res.json();
      if (d.success) toast.success('Get Pass settings saved');
      else toast.error(d.error || 'Save failed');
    } catch (_e) { toast.error('Save failed'); }
    setSavingPass(false);
  };

  const saveExamPrice = async () => {
    if (!selectedExam) { toast.error('Select an exam first'); return; }
    setRowSaving(s => ({ ...s, exam: true }));
    try {
      const payload = {};
      payload[examPriceField] = parseFloat(examPriceInput) || 0;
      const res = await fetch(`/api/admin/exams/${selectedExam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Saved ${contentType === 'previous_year' ? 'PYQ' : 'Test Series'} price for ${selectedExam.name}`);
        await fetchAll();
      } else toast.error(d.error || 'Save failed');
    } catch (_e) { toast.error('Save failed'); }
    setRowSaving(s => ({ ...s, exam: false }));
  };

  const saveDomainPrice = async () => {
    if (!selectedDomain) { toast.error('Select a domain first'); return; }
    setRowSaving(s => ({ ...s, domain: true }));
    try {
      const payload = {};
      payload[domainPriceField] = parseFloat(domainPriceInput) || 0;
      const res = await fetch(`/api/admin/domains/${selectedDomain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Saved ${contentType === 'previous_year' ? 'PYQ' : 'Test Series'} price for ${selectedDomain.name}`);
        await fetchAll();
      } else toast.error(d.error || 'Save failed');
    } catch (_e) { toast.error('Save failed'); }
    setRowSaving(s => ({ ...s, domain: false }));
  };

  const examDomains = domains.filter(d => d.examId === selectedExamId);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
        <p className="text-sm text-gray-500">Set prices for Get Pass, Test Series (Mock Tests), and Previous Year Questions. Individual tests are not sold separately.</p>
      </div>

      {/* Get Pass card */}
      <Card className="border-2 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">Get Pass (all-access)</h3>
              <p className="text-sm text-gray-600">Unlocks every Test Series, every Domain, every PYQ paper (including all <b>future/upcoming</b> tests) for the validity period below.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" min="0" step="1" value={pass.getPassPrice}
                    onChange={e => setPass(p => ({ ...p, getPassPrice: e.target.value }))} />
                </div>
                <div>
                  <Label>Validity</Label>
                  <Select value={String(pass.getPassDurationDays)}
                    onValueChange={v => setPass(p => ({ ...p, getPassDurationDays: parseInt(v, 10) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(o => <SelectItem key={o.days} value={String(o.days)}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Switch id="pass-enabled" checked={pass.getPassEnabled}
                    onCheckedChange={v => setPass(p => ({ ...p, getPassEnabled: v }))} />
                  <Label htmlFor="pass-enabled" className="cursor-pointer">Enabled (visible to users)</Label>
                </div>
                <div className="flex items-end">
                  <Button onClick={savePass} disabled={savingPass} className="bg-brand-600 hover:bg-brand-700 w-full">
                    {savingPass ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-2" /> Save Pass</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structured flow: Type -> Section -> Exam/Domain */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Content Pricing</h3>

          {/* Step 1: Content Type */}
          <div className="mb-4">
            <Label className="mb-2 block">Step 1 — Content Type</Label>
            <div className="flex gap-2">
              <Button
                variant={contentType === 'mock_test' ? 'default' : 'outline'}
                className={contentType === 'mock_test' ? 'bg-brand-600 hover:bg-brand-700' : ''}
                onClick={() => { setContentType('mock_test'); setSelectedExamId(''); setSelectedDomainId(''); }}
              >
                <ClipboardList className="w-4 h-4 mr-2" /> Mock Test (Test Series)
              </Button>
              <Button
                variant={contentType === 'previous_year' ? 'default' : 'outline'}
                className={contentType === 'previous_year' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                onClick={() => { setContentType('previous_year'); setSelectedExamId(''); setSelectedDomainId(''); }}
              >
                <ScrollText className="w-4 h-4 mr-2" /> Previous Year (PYQ)
              </Button>
            </div>
          </div>

          {/* Step 2: Section */}
          <div className="mb-4">
            <Label className="mb-2 block">Step 2 — Pricing Section</Label>
            <div className="flex gap-2">
              <Button
                variant={section === 'exam' ? 'default' : 'outline'}
                className={section === 'exam' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                onClick={() => { setSection('exam'); setSelectedDomainId(''); }}
              >
                <GraduationCap className="w-4 h-4 mr-2" /> Exam Pricing <span className="ml-2 text-xs opacity-80">(full access)</span>
              </Button>
              <Button
                variant={section === 'domain' ? 'default' : 'outline'}
                className={section === 'domain' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                onClick={() => setSection('domain')}
              >
                <Layers className="w-4 h-4 mr-2" /> Domain Pricing <span className="ml-2 text-xs opacity-80">(that domain only)</span>
              </Button>
            </div>
          </div>

          {/* Info banner */}
          <div className={`mb-5 p-3 rounded-lg text-sm flex items-start gap-2 ${
            section === 'exam' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="font-semibold flex-shrink-0">Rule:</div>
            <div>
              {section === 'exam'
                ? <>Exam purchase → unlocks <b>every domain and every {contentType === 'previous_year' ? 'PYQ' : 'mock'} test</b> within that exam.</>
                : <>Domain purchase → unlocks <b>only the {contentType === 'previous_year' ? 'PYQ' : 'mock'} tests inside that domain</b>.</>
              }
            </div>
          </div>

          {/* Step 3: Exam selection (both sections) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Step 3 — Select Exam</Label>
              <Select value={selectedExamId || ''} onValueChange={v => { setSelectedExamId(v); setSelectedDomainId(''); }}>
                <SelectTrigger><SelectValue placeholder="Pick an exam" /></SelectTrigger>
                <SelectContent>
                  {exams?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {section === 'domain' && (
              <div>
                <Label>Step 4 — Select Domain</Label>
                <Select value={selectedDomainId || ''} onValueChange={setSelectedDomainId} disabled={!selectedExamId}>
                  <SelectTrigger><SelectValue placeholder={selectedExamId ? "Pick a domain" : "Pick exam first"} /></SelectTrigger>
                  <SelectContent>
                    {examDomains.length === 0 ? (
                      <SelectItem value="__none__" disabled>No domains for this exam</SelectItem>
                    ) : examDomains.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Price editor */}
          {section === 'exam' ? (
            selectedExam && (
              <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-amber-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Setting <b>{contentType === 'previous_year' ? 'PYQ Exam' : 'Test Series (Exam)'}</b> price for</p>
                    <h4 className="font-bold text-lg text-gray-900">{selectedExam.name}</h4>
                  </div>
                  <Badge className={contentType === 'previous_year' ? 'bg-purple-600' : 'bg-amber-600'}>
                    {contentType === 'previous_year' ? 'PYQ' : 'Mock'} · Exam-level
                  </Badge>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Price (₹)</Label>
                    <Input type="number" min="0" step="1" value={examPriceInput}
                      onChange={(e) => setExamPriceInput(e.target.value)} />
                  </div>
                  <Button className="bg-brand-600 hover:bg-brand-700" onClick={saveExamPrice} disabled={rowSaving.exam}>
                    {rowSaving.exam ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-2" /> Save Price</>}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Current saved: <b>₹{Number(selectedExam[examPriceField] || 0).toLocaleString('en-IN')}</b></p>
              </div>
            )
          ) : (
            selectedDomain && (
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Setting <b>{contentType === 'previous_year' ? 'PYQ Domain' : 'Test Series (Domain)'}</b> price for</p>
                    <h4 className="font-bold text-lg text-gray-900">{selectedDomain.name}</h4>
                    <p className="text-xs text-gray-500">Under {selectedExam?.name}</p>
                  </div>
                  <Badge className={contentType === 'previous_year' ? 'bg-purple-600' : 'bg-blue-600'}>
                    {contentType === 'previous_year' ? 'PYQ' : 'Mock'} · Domain-level
                  </Badge>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Price (₹)</Label>
                    <Input type="number" min="0" step="1" value={domainPriceInput}
                      onChange={(e) => setDomainPriceInput(e.target.value)} />
                  </div>
                  <Button className="bg-brand-600 hover:bg-brand-700" onClick={saveDomainPrice} disabled={rowSaving.domain}>
                    {rowSaving.domain ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-2" /> Save Price</>}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Current saved: <b>₹{Number(selectedDomain[domainPriceField] || 0).toLocaleString('en-IN')}</b></p>
              </div>
            )
          )}

          {!selectedExamId && (
            <div className="text-sm text-gray-500 italic">Select an exam to begin.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Reviewer Tab =====
function ReviewerTab({ userRole }) {
  const [filter, setFilter] = useState('PENDING_REVIEW');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTestId, setOpenTestId] = useState(null);

  const isAdminRole = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const fetchQueue = async (status = filter) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/reviewer/queue?status=${encodeURIComponent(status)}`, { credentials: 'include' });
      const d = await r.json();
      if (d.success) setTests(d.data || []);
      else toast.error(d.error || 'Failed to load reviewer queue');
    } catch (_e) {
      toast.error('Failed to load reviewer queue');
    }
    setLoading(false);
  };

  useEffect(() => { fetchQueue(filter); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  if (!isAdminRole) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ShieldCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">Reviewer access requires Super Admin or Admin role.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-brand-600" /> Reviewer Queue
        </h2>
        <span className="text-sm text-gray-500">{tests.length} test{tests.length === 1 ? '' : 's'}</span>
        <div className="ml-auto">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="PUBLISHED">Recently Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" /></div>
          ) : tests.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-600">
                {filter === 'PENDING_REVIEW' && 'No tests waiting for review.'}
                {filter === 'REJECTED' && 'No rejected tests.'}
                {filter === 'PUBLISHED' && 'No published tests yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Exam / Domain / Subject</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent on</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={t.title}>{t.title}</div>
                      {t.rejectionReason && (
                        <div className="text-xs text-red-600 mt-0.5 truncate" title={t.rejectionReason}>
                          Reason: {t.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t.testType === 'practice_questions' ? 'Practice' : t.testType === 'previous_year' ? 'PYQ' : 'Mock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="text-gray-700">{t.examName || '—'}</div>
                      <div className="text-xs text-gray-500">
                        {[t.domainName, t.subjectName].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{t.totalQuestions}</span>
                    </TableCell>
                    <TableCell>
                      {t.reviewStatus === 'PENDING_REVIEW' && <Badge className="bg-amber-500">Pending Review</Badge>}
                      {t.reviewStatus === 'PUBLISHED' && <Badge className="bg-green-600">Published</Badge>}
                      {t.reviewStatus === 'REJECTED' && <Badge className="bg-red-500">Rejected</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {t.sentToReviewAt ? new Date(t.sentToReviewAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setOpenTestId(t.id)}>
                        <Eye className="w-4 h-4 mr-1" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {openTestId && (
        <ReviewerPreviewDialog
          testId={openTestId}
          onClose={() => setOpenTestId(null)}
          onActionDone={() => { setOpenTestId(null); fetchQueue(filter); }}
        />
      )}
    </div>
  );
}

function ReviewerPreviewDialog({ testId, onClose, onActionDone }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('test'); // 'test' | 'list'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/admin/reviewer/test/${testId}`, { credentials: 'include' });
        const d = await r.json();
        if (d.success) {
          setData(d.data);
          setCurrentIdx(0);
        } else {
          toast.error(d.error || 'Failed to load test');
          onClose();
        }
      } catch (_e) {
        toast.error('Failed to load test');
        onClose();
      }
      setLoading(false);
    })();
  }, [testId, onClose]);

  const isPending = data?.test?.reviewStatus === 'PENDING_REVIEW';

  const publish = async () => {
    if (!confirm('Approve and publish this test? It will become visible to users.')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/reviewer/test/${testId}/publish`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const d = await r.json();
      if (d.success) { toast.success('Test approved & published'); onActionDone(); }
      else toast.error(d.error || 'Failed to publish');
    } catch (_e) { toast.error('Failed to publish'); }
    setBusy(false);
  };

  const reject = async () => {
    if (!rejectReason.trim()) { toast.error('Please enter a reason'); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/reviewer/test/${testId}/reject`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      const d = await r.json();
      if (d.success) { toast.success('Test rejected'); onActionDone(); }
      else toast.error(d.error || 'Failed to reject');
    } catch (_e) { toast.error('Failed to reject'); }
    setBusy(false);
    setShowReject(false);
  };

  return (
    <Dialog open={!!testId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-brand-600" />
              Review: {data?.test?.title || '...'}
            </span>
            {data?.test?.reviewStatus && (
              <Badge className={
                data.test.reviewStatus === 'PENDING_REVIEW' ? 'bg-amber-500' :
                data.test.reviewStatus === 'PUBLISHED' ? 'bg-green-600' :
                'bg-red-500'
              }>
                {data.test.reviewStatus.replace('_', ' ')}
              </Badge>
            )}
          </DialogTitle>
          {data?.test && (
            <DialogDescription className="text-xs">
              {[data.test.examName, data.test.domainName, data.test.subjectName].filter(Boolean).join(' · ')}
              {' · '}
              {data.test.totalQuestions} questions · {data.test.duration} min · {data.test.totalMarks} marks
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : data ? (
          <>
            <Tabs value={view} onValueChange={setView} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <TabsList className="grid w-full max-w-md grid-cols-2 self-start mx-1 flex-shrink-0">
                <TabsTrigger value="test"><Eye className="w-4 h-4 mr-1" /> Test View</TabsTrigger>
                <TabsTrigger value="list"><FileTextIcon className="w-4 h-4 mr-1" /> List View</TabsTrigger>
              </TabsList>

              <TabsContent value="test" className="flex-1 overflow-hidden mt-3 min-h-0 data-[state=inactive]:hidden">
                <ReviewerTestView
                  questions={data.questions}
                  currentIdx={currentIdx}
                  setCurrentIdx={setCurrentIdx}
                />
              </TabsContent>

              <TabsContent value="list" className="flex-1 overflow-y-auto mt-3 pr-2 min-h-0 data-[state=inactive]:hidden">
                <ReviewerListView questions={data.questions} />
              </TabsContent>
            </Tabs>

            <DialogFooter className="border-t pt-3 mt-2 flex-shrink-0">
              <div className="flex w-full items-center gap-2">
                <Button variant="outline" onClick={onClose} disabled={busy}>Close</Button>
                {isPending && (
                  <>
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50 ml-auto"
                      onClick={() => setShowReject(true)}
                      disabled={busy}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={publish}
                      disabled={busy}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" /> {busy ? 'Publishing...' : 'Approve & Publish'}
                    </Button>
                  </>
                )}
                {!isPending && (
                  <span className="ml-auto text-sm text-gray-500">
                    {data.test.reviewStatus === 'PUBLISHED' && 'This test is already live.'}
                    {data.test.reviewStatus === 'REJECTED' && 'This test was rejected. Reason: ' + (data.test.rejectionReason || '—')}
                  </span>
                )}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>

      {/* Reject reason sub-dialog */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Test</DialogTitle>
            <DialogDescription>This sends the test back to draft state. Provide a reason for the admin.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (required)"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReject(false)} disabled={busy}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={reject} disabled={busy || !rejectReason.trim()}>
              {busy ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function ReviewerTestView({ questions, currentIdx, setCurrentIdx }) {
  if (!questions || questions.length === 0) {
    return <div className="p-12 text-center text-gray-500">No questions in this test.</div>;
  }
  const q = questions[currentIdx];
  const correctNum = Number(q.correct_option_number);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr,260px] gap-4 h-full overflow-hidden min-h-0">
      {/* Question Display */}
      <div className="overflow-y-auto pr-3 min-h-0 max-h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">
            Question {currentIdx + 1} <span className="text-gray-400 font-normal">/ {questions.length}</span>
          </h3>
          {q.topic_title && <Badge variant="outline">{q.topic_title}</Badge>}
        </div>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="prose prose-sm max-w-none">
              <div className="text-base font-medium text-gray-900 whitespace-pre-wrap">{q.question_title}</div>
              {q.question_image_url && (
                <img src={q.question_image_url} alt="Question" className="mt-3 max-h-72 rounded border" />
              )}
            </div>
            <div className="space-y-2 mt-4">
              {q.options.map((opt) => {
                const isCorrect = Number(opt.number) === correctNum;
                return (
                  <div
                    key={opt.number}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {String.fromCharCode(64 + Number(opt.number))}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{opt.title}</div>
                      {opt.image_url && <img src={opt.image_url} alt={`Option ${opt.number}`} className="mt-2 max-h-40 rounded border" />}
                    </div>
                    {isCorrect && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
            {(q.solution_text || q.solution_image_url || q.tip) && (
              <div className="border-t pt-3 mt-3">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Solution</div>
                {q.solution_text && <div className="text-sm text-gray-800 whitespace-pre-wrap">{q.solution_text}</div>}
                {q.solution_image_url && <img src={q.solution_image_url} alt="Solution" className="mt-2 max-h-60 rounded border" />}
                {q.tip && <div className="text-xs text-blue-700 mt-2"><b>Tip:</b> {q.tip}</div>}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Question Palette */}
      <div className="border-l pl-4 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Question Palette</div>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-9 h-9 rounded text-xs font-semibold border ${
                idx === currentIdx
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewerListView({ questions }) {
  if (!questions || questions.length === 0) {
    return <div className="p-12 text-center text-gray-500">No questions in this test.</div>;
  }
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const correctNum = Number(q.correct_option_number);
        return (
          <Card key={q.id || idx}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-semibold text-gray-900">
                  Q{idx + 1}.&nbsp;
                  <span className="font-normal whitespace-pre-wrap">{q.question_title}</span>
                </h4>
                {q.topic_title && <Badge variant="outline" className="flex-shrink-0">{q.topic_title}</Badge>}
              </div>
              {q.question_image_url && <img src={q.question_image_url} alt="Q" className="max-h-56 rounded border" />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt) => {
                  const isCorrect = Number(opt.number) === correctNum;
                  return (
                    <div key={opt.number} className={`p-2 rounded border text-sm ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <span className={`font-semibold mr-2 ${isCorrect ? 'text-green-700' : 'text-gray-500'}`}>
                        {String.fromCharCode(64 + Number(opt.number))}.
                      </span>
                      <span className="whitespace-pre-wrap">{opt.title}</span>
                      {opt.image_url && <img src={opt.image_url} alt="" className="mt-1 max-h-32 rounded" />}
                    </div>
                  );
                })}
              </div>
              {q.solution_text && (
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <b>Solution:</b> {q.solution_text}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


// ===== Creative Control Tab =====
const CREATIVE_COLORS = [
  { id: 'green', label: 'Green', cls: 'bg-green-100 text-green-600' },
  { id: 'blue', label: 'Blue', cls: 'bg-blue-100 text-blue-600' },
  { id: 'amber', label: 'Amber', cls: 'bg-amber-100 text-amber-600' },
  { id: 'brand', label: 'Brand', cls: 'bg-brand-100 text-brand-600' },
  { id: 'purple', label: 'Purple', cls: 'bg-purple-100 text-purple-600' },
  { id: 'red', label: 'Red', cls: 'bg-red-100 text-red-600' },
];

function CreativeControlTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(Date.now());
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/creative-control', { credentials: 'include' });
      const d = await r.json();
      if (d.success) setSettings(d.data);
      else toast.error(d.error || 'Failed to load settings');
    } catch (_e) { toast.error('Failed to load'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/creative-control', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroBadgeTitle: settings.heroBadgeTitle,
          heroBadgeSubtitle: settings.heroBadgeSubtitle,
          heroBannerAlt: settings.heroBannerAlt,
          heroBadgeColor: settings.heroBadgeColor,
          heroBannerImageUrl: settings.heroBannerImageUrl,
        }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success('Saved. Changes will reflect on the home page.');
        setSettings(d.data);
        setPreview(Date.now());
      } else {
        toast.error(d.error || 'Save failed');
      }
    } catch (_e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const uploadBanner = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Image too large (max 8 MB)'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await fetch('/api/admin/creative-control/banner-image', {
        method: 'POST', credentials: 'include', body: fd,
      });
      const d = await r.json();
      if (d.success) {
        toast.success('Banner image updated');
        await load();
        setPreview(Date.now());
      } else {
        toast.error(d.error || 'Upload failed');
      }
    } catch (_e) { toast.error('Upload failed'); }
    setUploading(false);
  };

  if (loading || !settings) {
    return <Card><CardContent className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" /></CardContent></Card>;
  }

  const colorDef = CREATIVE_COLORS.find(c => c.id === settings.heroBadgeColor) || CREATIVE_COLORS[0];
  const previewSrc = settings.heroBannerImageUrl
    ? (settings.heroBannerImageUrl.startsWith('/api/') ? `${settings.heroBannerImageUrl.split('?')[0]}?v=${preview}` : settings.heroBannerImageUrl)
    : 'https://customer-assets.emergentagent.com/job_7acc3893-d2c4-4511-8e86-2a2521e5fe9d/artifacts/harwama0_banner_%20finsl.png';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-brand-600" />
        <div>
          <h2 className="text-2xl font-bold">Creative Control</h2>
          <p className="text-sm text-gray-500">Manage the home page hero banner image and badge.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="font-semibold text-lg">Banner Image</h3>
            <div>
              <div className="relative rounded-xl overflow-hidden border bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt="banner preview" className="w-full object-cover max-h-72" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; uploadBanner(f); e.target.value = ''; }} />
              <div className="flex gap-2 mt-3">
                <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-1" /> {settings.heroBannerFileId ? 'Replace Image' : 'Upload Image'}
                </Button>
                <Button variant="outline" onClick={() => setPreview(Date.now())} title="Refresh preview">
                  Refresh
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">JPG/PNG/WEBP/GIF, up to 8 MB. Uploaded image automatically replaces the existing one.</p>
            </div>
            <div>
              <Label>Image alt text</Label>
              <Input value={settings.heroBannerAlt || ''} onChange={e => setSettings({ ...settings, heroBannerAlt: e.target.value })} placeholder="Describe the banner (accessibility)" />
            </div>
            <div>
              <Label>Or use an external image URL (optional)</Label>
              <Input value={settings.heroBannerImageUrl || ''} onChange={e => setSettings({ ...settings, heroBannerImageUrl: e.target.value })} placeholder="https://..." />
              <p className="text-xs text-gray-500 mt-1">If set, this URL overrides any uploaded image. Leave blank to use the uploaded image.</p>
            </div>

            <hr />

            <h3 className="font-semibold text-lg">Badge Text</h3>
            <div>
              <Label>Title (e.g., "95% Success Rate")</Label>
              <Input value={settings.heroBadgeTitle || ''} onChange={e => setSettings({ ...settings, heroBadgeTitle: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>Subtitle (e.g., "In Top Exams")</Label>
              <Input value={settings.heroBadgeSubtitle || ''} onChange={e => setSettings({ ...settings, heroBadgeSubtitle: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>Accent colour</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
                {CREATIVE_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, heroBadgeColor: c.id })}
                    className={`px-2 py-1.5 rounded border text-xs font-medium flex items-center gap-2 ${settings.heroBadgeColor === c.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-300'}`}
                  >
                    <span className={`w-4 h-4 rounded-full ${c.cls.split(' ')[0]}`}></span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-brand-600" /> Live Preview</h3>
            <div className="bg-gradient-to-b from-brand-50 to-white rounded-xl p-6">
              <div className="relative">
                <div className="bg-brand-100 rounded-3xl p-3 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewSrc} alt={settings.heroBannerAlt || ''} className="rounded-2xl shadow-xl w-full object-cover" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorDef.cls.split(' ')[0]}`}>
                      <Trophy className={`w-6 h-6 ${colorDef.cls.split(' ')[1]}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{settings.heroBadgeTitle || '—'}</p>
                      <p className="text-sm text-gray-500">{settings.heroBadgeSubtitle || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-6">This is how the hero section will appear on the home page.</p>
            </div>
            <div className="mt-4">
              <Link href="/" target="_blank">
                <Button variant="outline" className="w-full">
                  Open home page in new tab
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

