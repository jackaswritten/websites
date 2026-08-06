import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Calendar, BookOpen, User, Lock, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Cookie helper functions
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

interface Application {
  id: string;
  teacher_name: string;
  subject: string;
  application_date: string;
  class_level: string;
  class_info?: string;
  created_at: string;
}

const classLevelMap: { [key: string]: string } = {
  "1": "الحصة الأولى",
  "2": "الحصة الثانية",
  "3": "الحصة الثالثة",
  "4": "الحصة الرابعة",
  "5": "الحصة الخامسة",
  "6": "الحصة السادسة",
};

const Admin = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<{ id: string; name: string } | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  useEffect(() => {
    // Check if user was previously authenticated via cookie
    const savedAuth = getCookie('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchSupervisorEmail();
    }
  }, [isAuthenticated]);

useEffect(() => {
  if (isLocked && lockoutTime) {
    const timer = setInterval(() => {
      const now = Date.now();
      if (now >= lockoutTime) {
        setIsLocked(false);
        setLoginAttempts(0);
        setLockoutTime(null);
        toast.success("يمكنك المحاولة مرة أخرى");
      }
    }, 1000);

    return () => clearInterval(timer);
  }
}, [isLocked, lockoutTime]);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isLocked) {
    const remainingTime = lockoutTime ? Math.ceil((lockoutTime - Date.now()) / 1000) : 0;
    toast.error(`تم حظر تسجيل الدخول. حاول مرة أخرى بعد ${remainingTime} ثانية`);
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("setting_value")
      .eq("setting_key", "admin_password")
      .single();

    if (error) throw error;

    if (password === data.setting_value) {
      setIsAuthenticated(true);
      setCookie('admin_authenticated', 'true', 7);
      setLoginAttempts(0);
      toast.success("تم تسجيل الدخول بنجاح");
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        const lockTime = Date.now() + 30000; // 30 seconds lockout
        setLockoutTime(lockTime);
        toast.error("تم حظر تسجيل الدخول لمدة 30 ثانية بسبب المحاولات الفاشلة");
      } else {
        toast.error(`كلمة المرور غير صحيحة (${newAttempts}/3 محاولات)`);
      }
    }
  } catch (error) {
    console.error("Error checking password:", error);
    toast.error("حدث خطأ في تسجيل الدخول");
  }
};

  const handleLogout = () => {
    deleteCookie('admin_authenticated');
    setIsAuthenticated(false);
    toast.success("تم تسجيل الخروج");
  };

  const fetchApplications = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .gte("application_date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisorEmail = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("setting_value")
        .eq("setting_key", "supervisor_email")
        .single();

      if (error) throw error;

      setSupervisorEmail(data?.setting_value || "");
    } catch (error) {
      console.error("Error fetching supervisor email:", error);
    }
  };

  const updateSupervisorEmail = async () => {
    if (!supervisorEmail) {
      toast.error("الرجاء إدخال البريد الإلكتروني");
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase
        .from("settings")
        .update({ setting_value: supervisorEmail, updated_at: new Date().toISOString() })
        .eq("setting_key", "supervisor_email");

      if (error) throw error;

      toast.success("تم تحديث البريد الإلكتروني بنجاح");
    } catch (error) {
      console.error("Error updating supervisor email:", error);
      toast.error("فشل في تحديث البريد الإلكتروني");
    } finally {
      setEmailLoading(false);
    }
  };

  const confirmDelete = (id: string, teacherName: string) => {
    setApplicationToDelete({ id, name: teacherName });
    setDeleteDialogOpen(true);
  };

  const deleteApplication = async () => {
    if (!applicationToDelete) return;

    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", applicationToDelete.id);

      if (error) throw error;

      toast.success("تم حذف الطلب بنجاح");
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
      fetchApplications();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("فشل في حذف الطلب");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE، dd MMMM yyyy", { locale: ar });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="text-2xl flex items-center gap-2 justify-center text-primary">
              <Lock className="h-6 w-6" />
              تسجيل دخول المشرف
            </CardTitle>
            <CardDescription className="text-center">
              الرجاء إدخال كلمة المرور للوصول إلى لوحة الإدارة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLocked}>
               {isLocked 
                ? `محظور (${lockoutTime ? Math.ceil((lockoutTime - Date.now()) / 1000) : 0}s)` 
               : "تسجيل الدخول"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة للصفحة الرئيسية
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة لنموذج الطلب
          </Button>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              لوحة الإدارة
            </h1>
            <p className="text-muted-foreground">
              مراجعة وإدارة طلبات المعلمين
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>

        <div className="mb-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="text-2xl flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" />
                البريد الإلكتروني للمشرف
              </CardTitle>
              <CardDescription>
                سيتم إرسال إشعارات الطلبات إلى هذا البريد الإلكتروني
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="supervisorEmail">البريد الإلكتروني</Label>
                  <Input
                    id="supervisorEmail"
                    type="email"
                    placeholder="supervisor@school.edu"
                    value={supervisorEmail}
                    onChange={(e) => setSupervisorEmail(e.target.value)}
                  />
                </div>
                <Button onClick={updateSupervisorEmail} disabled={emailLoading}>
                  {emailLoading ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">جاري تحميل الطلبات...</p>
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                لا توجد طلبات مقدمة بعد
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <User className="h-5 w-5 text-primary" />
                    {app.teacher_name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <BookOpen className="h-4 w-4" />
                    {app.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {app.class_info && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">
                          الصف
                        </p>
                        <p className="text-foreground font-medium">
                          {app.class_info.split('-').reverse().join('-')}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">
                        التاريخ
                      </p>
                      <p className="text-foreground">
                        {formatDate(app.application_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">
                        الحصة
                      </p>
                      <p className="text-foreground">
                        {classLevelMap[app.class_level] || app.class_level}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      تم التقديم في{" "}
                      {format(new Date(app.created_at), "dd/MM/yyyy", { locale: ar })}
                    </p>
                  </div>
                  <div className="pt-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => confirmDelete(app.id, app.teacher_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف الطلب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف طلب <strong>{applicationToDelete?.name}</strong> بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={deleteApplication} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;