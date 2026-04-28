'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainNavbar } from '@/components/MainNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Loader2, User, Shield, CreditCard, TrendingUp, Bell, LifeBuoy, Camera, Trash2,
  LogOut, KeyRound, Crown, CheckCircle, Clock, Moon, Sun, AlertTriangle, Send, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

export default function ManageAccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');

  const fetchAll = async () => {
    try {
      const [p, a] = await Promise.all([
        fetch('/api/profile', { credentials: 'include' }),
        fetch('/api/user/analytics', { credentials: 'include' }),
      ]);
      if (p.status === 401) { router.push('/login?next=/profile'); return; }
      const pj = await p.json();
      const aj = await a.json();
      if (pj.success) setProfile(pj.data);
      if (aj.success) setAnalytics(aj.data);
    } catch (_e) {
      toast.error('Failed to load account');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="pt-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="pt-24 pb-12 container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Account</h1>
          <p className="text-gray-600">Profile, security, subscriptions and preferences.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-1 hidden sm:inline" /> Profile</TabsTrigger>
            <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1 hidden sm:inline" /> Security</TabsTrigger>
            <TabsTrigger value="subscription"><CreditCard className="w-4 h-4 mr-1 hidden sm:inline" /> Subscription</TabsTrigger>
            <TabsTrigger value="activity"><TrendingUp className="w-4 h-4 mr-1 hidden sm:inline" /> Activity</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1 hidden sm:inline" /> Preferences</TabsTrigger>
            <TabsTrigger value="support"><LifeBuoy className="w-4 h-4 mr-1 hidden sm:inline" /> Support</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileSection profile={profile} onRefresh={fetchAll} />
          </TabsContent>
          <TabsContent value="security" className="mt-6">
            <SecuritySection profile={profile} onRefresh={fetchAll} />
          </TabsContent>
          <TabsContent value="subscription" className="mt-6">
            <SubscriptionSection profile={profile} analytics={analytics} />
          </TabsContent>
          <TabsContent value="activity" className="mt-6">
            <ActivitySection analytics={analytics} />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <PreferencesSection profile={profile} onRefresh={fetchAll} />
          </TabsContent>
          <TabsContent value="support" className="mt-6">
            <SupportSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ==================== PROFILE TAB ====================
function ProfileSection({ profile, onRefresh }) {
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const fileInputRef = useRef(null);

  const avatarUrl = profile.avatarFileId
    ? `/api/user/${profile.id}/avatar?v=${avatarVersion}`
    : null;

  const initials = (profile.name || profile.email || 'U').slice(0, 2).toUpperCase();

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/profile', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      });
      const d = await r.json();
      if (d.success) {
        toast.success('Profile updated');
        // Update localStorage user so navbar reflects change
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...u, name, email }));
            window.dispatchEvent(new Event('userChanged'));
          }
        } catch (_e) {}
        onRefresh();
      } else {
        toast.error(d.error || 'Update failed');
      }
    } catch (_e) { toast.error('Update failed'); }
    setSaving(false);
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image too large (max 3 MB)'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const r = await fetch('/api/user/avatar', { method: 'POST', credentials: 'include', body: fd });
      const d = await r.json();
      if (d.success) {
        toast.success('Photo updated');
        setAvatarVersion(Date.now());
        onRefresh();
      } else {
        toast.error(d.error || 'Upload failed');
      }
    } catch (_e) { toast.error('Upload failed'); }
    setUploading(false);
  };

  const removeAvatar = async () => {
    if (!confirm('Remove your profile photo?')) return;
    setUploading(true);
    try {
      const r = await fetch('/api/user/avatar', { method: 'DELETE', credentials: 'include' });
      const d = await r.json();
      if (d.success) { toast.success('Photo removed'); onRefresh(); }
      else toast.error(d.error || 'Failed');
    } catch (_e) { toast.error('Failed'); }
    setUploading(false);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5 text-brand-600" /> Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-brand-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-100 text-brand-700 text-2xl font-bold flex items-center justify-center border-2 border-brand-200">
                {initials}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; uploadAvatar(f); e.target.value = ''; }} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Camera className="w-4 h-4 mr-1" /> {profile.avatarFileId ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {profile.avatarFileId && (
                <Button size="sm" variant="outline" onClick={removeAvatar} disabled={uploading}>
                  <Trash2 className="w-4 h-4 mr-1" /> Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">JPG/PNG/WEBP/GIF up to 3 MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
              disabled={profile.authProvider === 'google'} />
            {profile.authProvider === 'google' && <p className="text-xs text-gray-500 mt-1">Email managed by Google sign-in.</p>}
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 ..."/>
          </div>
          <div>
            <Label>Role</Label>
            <div className="mt-2"><Badge variant="outline">{profile.role || 'USER'}</Badge></div>
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
  );
}

// ==================== SECURITY TAB ====================
function SecuritySection({ profile, onRefresh }) {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePwd, setDeletePwd] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    setChanging(true);
    try {
      const r = await fetch('/api/user/change-password', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const d = await r.json();
      if (d.success) {
        toast.success(d.message || 'Password changed');
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        toast.error(d.error || 'Failed to change password');
      }
    } catch (_e) { toast.error('Failed'); }
    setChanging(false);
  };

  const logoutAll = async () => {
    if (!confirm('Sign out from all devices? You will need to log in again everywhere.')) return;
    setLoggingOutAll(true);
    try {
      const r = await fetch('/api/user/logout-all-devices', { method: 'POST', credentials: 'include' });
      const d = await r.json();
      if (d.success) {
        toast.success('Signed out from all devices');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('userChanged'));
        setTimeout(() => router.push('/login'), 500);
      } else {
        toast.error(d.error || 'Failed');
      }
    } catch (_e) { toast.error('Failed'); }
    setLoggingOutAll(false);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const r = await fetch('/api/user/delete-account', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePwd, confirm: deleteConfirm })
      });
      const d = await r.json();
      if (d.success) {
        toast.success('Account deleted');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('userChanged'));
        setTimeout(() => router.push('/'), 500);
      } else {
        toast.error(d.error || 'Failed to delete');
      }
    } catch (_e) { toast.error('Failed'); }
    setDeleting(false);
  };

  const isSocial = profile.authProvider === 'google' && !profile.password;

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="w-5 h-5 text-brand-600" /> Change Password</h2>
          {isSocial ? (
            <p className="text-sm text-gray-600">Your account uses Google sign-in. Password change is not available here.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Current Password</Label>
                  <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-gray-500">Changing your password will sign out other devices.</p>
              <div className="flex justify-end">
                <Button onClick={changePassword} disabled={changing || !oldPassword || !newPassword}>
                  {changing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update Password
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><LogOut className="w-5 h-5 text-brand-600" /> Active Sessions</h2>
          <p className="text-sm text-gray-600">For your security, you can sign out from all devices at once. You'll need to log in again on every device, including this one.</p>
          <div>
            <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={logoutAll} disabled={loggingOutAll}>
              {loggingOutAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-1" />}
              Sign out from all devices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200">
        <CardContent className="p-6 space-y-3">
          <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Delete Account</h2>
          <p className="text-sm text-gray-600">Permanently delete your Unishaala account. This removes your profile and avatar. Your historical test attempts are anonymized but kept so leaderboards remain accurate. This cannot be undone.</p>
          <div>
            <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => setShowDelete(true)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete my account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>This action is permanent and cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {!isSocial && (
              <div>
                <Label>Current password</Label>
                <Input type="password" value={deletePwd} onChange={e => setDeletePwd(e.target.value)} />
              </div>
            )}
            <div>
              <Label>Type <b>DELETE</b> to confirm</Label>
              <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={deleteAccount} disabled={deleting || deleteConfirm !== 'DELETE' || (!isSocial && !deletePwd)}>
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== SUBSCRIPTION TAB ====================
function SubscriptionSection({ profile, analytics }) {
  const hasPass = !!profile.hasPass;
  const expiresAt = profile.passExpiresAt ? new Date(profile.passExpiresAt) : null;
  const now = new Date();
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;

  const purchases = analytics?.purchases || [];

  return (
    <div className="space-y-6">
      {/* Get Pass Status */}
      <Card className={hasPass ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50' : ''}>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Crown className={`w-5 h-5 ${hasPass ? 'text-amber-500' : 'text-gray-400'}`} /> Get Pass Status
            </h2>
            {hasPass
              ? <Badge className="bg-amber-500">Active</Badge>
              : <Badge variant="outline">Not active</Badge>}
          </div>
          {hasPass ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">You have unlimited access to all Test Series, Domains and PYQ papers.</p>
              {expiresAt && (
                <p className="text-sm">
                  <span className="text-gray-500">Expires on:</span>{' '}
                  <b>{expiresAt.toLocaleDateString()}</b>
                  {daysLeft != null && <span className="text-gray-500 ml-2">({daysLeft} day{daysLeft === 1 ? '' : 's'} left)</span>}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <Link href="/get-pass"><Button variant="outline">Renew / Upgrade</Button></Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Unlock all Test Series, Domains and Previous Year Papers with a single Get Pass.</p>
              <Link href="/get-pass">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  <Crown className="w-4 h-4 mr-1" /> Buy Get Pass
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase History */}
      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold">Purchase History</h2>
            <span className="ml-auto text-sm text-gray-500">{purchases.length} item{purchases.length === 1 ? '' : 's'}</span>
          </div>
          {purchases.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No purchases yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.itemName}</TableCell>
                      <TableCell><Badge variant="outline">{purchaseTypeLabel(p.paymentType)}</Badge></TableCell>
                      <TableCell>₹{Number(p.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {p.status === 'SUCCESS' ? <Badge className="bg-green-500">Success</Badge>
                          : p.status === 'PENDING' ? <Badge className="bg-amber-500">Pending</Badge>
                          : <Badge className="bg-red-500">Failed</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function purchaseTypeLabel(t) {
  switch (t) {
    case 'get_pass': return 'Get Pass';
    case 'exam_purchase': return 'Test Series';
    case 'domain_purchase': return 'Domain';
    case 'exam_pyq_purchase': return 'PYQ Series';
    case 'domain_pyq_purchase': return 'PYQ Domain';
    default: return t || '—';
  }
}

// ==================== ACTIVITY TAB ====================
function ActivitySection({ analytics }) {
  const summary = analytics?.summary;
  const history = (analytics?.history || []).slice(0, 15);
  if (!summary) return <Card><CardContent className="p-8 text-center text-gray-500">No activity data yet.</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Exams Attempted" value={summary.examsAttempted} />
        <StatBox label="Tests Attempted" value={summary.testsAttempted} />
        <StatBox label="Average Score" value={`${summary.averagePct}%`} />
        <StatBox label="Best Score" value={`${summary.bestPct}%`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Accuracy" value={`${summary.accuracy}%`} />
        <StatBox label="Correct" value={summary.totalCorrect} />
        <StatBox label="Incorrect" value={summary.totalIncorrect} />
        <StatBox label="Unanswered" value={summary.totalUnanswered} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold">Recent Test History</h2>
            <Link href="/dashboard" className="ml-auto">
              <Button size="sm" variant="outline">Open full dashboard</Button>
            </Link>
          </div>
          {history.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No attempts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(h => {
                    const done = h.status === 'COMPLETED' || h.endTime;
                    const pct = h.totalMarks > 0 ? Math.round((h.score / h.totalMarks) * 100) : 0;
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="max-w-xs font-medium">
                          <div className="truncate" title={h.testTitle}>{h.testTitle}</div>
                          <div className="text-xs text-gray-500">{h.examName || ''}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {h.testType === 'practice_questions' ? 'Practice' : h.testType === 'previous_year' ? 'PYQ' : 'Mock'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {done ? <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Done</Badge>
                                : <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" />In progress</Badge>}
                        </TableCell>
                        <TableCell>
                          {done ? <span><b>{h.score}</b> / {h.totalMarks} <span className="text-xs text-gray-500">({pct}%)</span></span> : '—'}
                        </TableCell>
                        <TableCell>
                          {h.rank ? <span className="font-semibold">#{h.rank}<span className="text-xs text-gray-500 ml-1">/ {h.totalTakers}</span></span> : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {h.startTime ? new Date(h.startTime).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
}

// ==================== PREFERENCES TAB ====================
function PreferencesSection({ profile, onRefresh }) {
  const [prefs, setPrefs] = useState({
    emailEnabled: profile.notificationPrefs?.emailEnabled !== false,
    examReminders: profile.notificationPrefs?.examReminders !== false,
    productUpdates: profile.notificationPrefs?.productUpdates !== false,
  });
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const t = typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light';
    setTheme(t);
    applyTheme(t);
  }, []);

  const applyTheme = (t) => {
    if (typeof document === 'undefined') return;
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const toggleTheme = (next) => {
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
    toast.success(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled`);
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/user/notification-prefs', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const d = await r.json();
      if (d.success) { toast.success('Preferences saved'); onRefresh(); }
      else toast.error(d.error || 'Failed');
    } catch (_e) { toast.error('Failed'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-brand-600" /> Email Notifications</h2>
          <PrefRow
            label="Receive emails"
            desc="Turn off to stop all non-critical emails from Unishaala."
            checked={prefs.emailEnabled}
            onChange={v => setPrefs(p => ({ ...p, emailEnabled: v }))}
          />
          <PrefRow
            label="Exam reminders & updates"
            desc="Get notified about exam notifications and important deadlines."
            checked={prefs.examReminders}
            onChange={v => setPrefs(p => ({ ...p, examReminders: v }))}
            disabled={!prefs.emailEnabled}
          />
          <PrefRow
            label="Product news"
            desc="New features, improvements and offers from Unishaala."
            checked={prefs.productUpdates}
            onChange={v => setPrefs(p => ({ ...p, productUpdates: v }))}
            disabled={!prefs.emailEnabled}
          />
          <div className="flex justify-end">
            <Button onClick={savePrefs} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-brand-600" /> : <Sun className="w-5 h-5 text-brand-600" />}
            Theme
          </h2>
          <div className="flex gap-3">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => toggleTheme('light')}>
              <Sun className="w-4 h-4 mr-1" /> Light
            </Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => toggleTheme('dark')}>
              <Moon className="w-4 h-4 mr-1" /> Dark
            </Button>
          </div>
          <p className="text-xs text-gray-500">Theme preference is stored on this device.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PrefRow({ label, desc, checked, onChange, disabled }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500 max-w-md">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

// ==================== SUPPORT TAB ====================
function SupportSection() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim() || !message.trim()) { toast.error('Subject and message are required'); return; }
    setSending(true);
    try {
      const r = await fetch('/api/user/support-ticket', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, message }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success(d.message || 'Ticket submitted');
        setSubject(''); setMessage(''); setCategory('general');
      } else {
        toast.error(d.error || 'Failed');
      }
    } catch (_e) { toast.error('Failed'); }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-brand-600" /> Help & Support</h2>
          <p className="text-sm text-gray-600">Need help? Reach out to our team and we'll respond as soon as possible.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg border bg-gray-50">
              <div className="text-xs text-gray-500">Email</div>
              <a className="font-medium text-brand-600" href="mailto:support@unishaala.com">support@unishaala.com</a>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <div className="text-xs text-gray-500">WhatsApp</div>
              <a className="font-medium text-green-600" href="https://wa.me/919829132906" target="_blank" rel="noopener noreferrer">9829132906</a>
            </div>
            <Link href="/contact" className="p-3 rounded-lg border bg-gray-50 hover:border-brand-300 transition">
              <div className="text-xs text-gray-500">Contact page</div>
              <div className="font-medium text-brand-600">Open contact form</div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Report an Issue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                value={category} onChange={e => setCategory(e.target.value)}
              >
                <option value="general">General</option>
                <option value="payment">Payment / Billing</option>
                <option value="test">Tests / Questions</option>
                <option value="account">Account / Login</option>
                <option value="bug">Bug / Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Briefly describe the issue" />
            </div>
          </div>
          <div>
            <Label>Message</Label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-gray-300 p-3 text-sm"
              placeholder="Describe the issue in detail. Include steps to reproduce if it's a bug."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={send} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Submit Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
