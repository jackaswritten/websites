import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Calendar, BookOpen, User, Lock, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Application {
  id: string;
  teacher_name: string;
  subject: string;
  application_date: string;
  class_level: string;
  notes: string | null;
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

const ADMIN_PASSWORD = "0k9CEo4H"; // Change this to your desired password

const Admin = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchSupervisorEmail();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success("تم تسجيل الدخول بنجاح");
    } else {
      toast.error("كلمة المرور غير صحيحة");
    }
  };

  const fetchApplications = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .gte("application_date", today) // Only fetch applications from today onwards
        .order("application_date", { ascending: true });

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
              <Button type="submit" className="w-full">
                تسجيل الدخول
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            لوحة الإدارة
          </h1>
          <p className="text-muted-foreground">
            مراجعة وإدارة طلبات المعلمين
          </p>
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
                  {app.notes && (
                    <div className="flex items-start gap-3 pt-2">
                      <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          ملاحظات
                        </p>
                        <p className="text-sm text-foreground bg-muted/50 p-2 rounded-md">
                          {app.notes}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      تم التقديم في{" "}
                      {format(new Date(app.created_at), "dd/MM/yyyy", { locale: ar })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;