import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, GraduationCap, Shield } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import libraryHero from "@/assets/library-hero.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [classLevel, setClassLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Array<{ date: string; classLevel: string }>>([]);

  useEffect(() => {
    fetchBookedSlots();
  }, []);

  const fetchBookedSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("application_date, class_level");

      if (error) throw error;

      const slots = data?.map((app) => ({
        date: app.application_date,
        classLevel: app.class_level,
      })) || [];
      setBookedSlots(slots);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
    }
  };

  const isSlotBooked = (date: Date, level: string) => {
    const dateString = format(date, "yyyy-MM-dd");
    return bookedSlots.some(
      (slot) => slot.date === dateString && slot.classLevel === level
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherName || !subject || !selectedDate || !classLevel) {
      toast.error("الرجاء تعبئة جميع الحقول");
      return;
    }

    setLoading(true);

    try {
      // Check for conflicts one more time before submitting
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const { data: existingSlots, error: checkError } = await supabase
        .from("applications")
        .select("class_level")
        .eq("application_date", dateString)
        .eq("class_level", classLevel);

      if (checkError) throw checkError;

      if (existingSlots && existingSlots.length > 0) {
        toast.error("هذه الحصة محجوزة في هذا التاريخ");
        setLoading(false);
        return;
      }

      // Insert application into database
      const { error: insertError } = await supabase.from("applications").insert({
        teacher_name: teacherName,
        subject,
        application_date: dateString,
        class_level: classLevel,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("هذه الحصة تم حجزها للتو من قبل معلم آخر");
        } else {
          throw insertError;
        }
        return;
      }

      // Send email notification
      await supabase.functions.invoke("notify-admin", {
        body: {
          teacherName,
          subject,
          date: format(selectedDate, "yyyy-MM-dd"),
          classLevel,
        },
      });

      toast.success("تم تقديم الطلب بنجاح!");

      // Reset form
      setTeacherName("");
      setSubject("");
      setSelectedDate(undefined);
      setClassLevel("");

      // Refresh booked slots
      fetchBookedSlots();
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("فشل في تقديم الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="relative w-full h-64 mb-8 overflow-hidden">
        <img 
          src={libraryHero} 
          alt="مكتبة مدرسية" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2 drop-shadow-lg text-outline-blue">
                نظام حجز المكتبة
              </h1>
              <p className="drop-shadow-md text-outline-blue">
                احجز حصتك في المكتبه من خلال تعبئة النموذج
              </p>

      <style jsx>{`
        .text-outline-blue {
          color: white;
          text-shadow: 
            1px 0 #3c83f6,   /* right */
            -1px 0 #3c83f6,  /* left */
            0 1px #3c83f6,   /* bottom */
            0 -1px #3c83f6,  /* top */
            1px 1px #3c83f6, /* bottom-right */
            -1px -1px #3c83f6, /* top-left */
            1px -1px #3c83f6, /* top-right */
            -1px 1px #3c83f6; /* bottom-left */
        }
      `}</style>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 pb-8 max-w-2xl">

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="text-primary">نموذج حجز المكتبة</CardTitle>
            <CardDescription>
              احجز حصتك التدريسية من خلال تعبئة النموذج
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
              <div className="space-y-2">
                <Label htmlFor="teacherName">اسم المعلم</Label>
                <Input
                  id="teacherName"
                  placeholder="أدخل اسمك الكامل"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">المادة العلمية</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="رياضيات">رياضيات</SelectItem>
                    <SelectItem value="علوم">علوم</SelectItem>
                    <SelectItem value="لغة عربية">لغة عربية</SelectItem>
                    <SelectItem value="لغة إنجليزية">لغة إنجليزية</SelectItem>
                    <SelectItem value="دراسات إسلامية">دراسات إسلامية</SelectItem>
                    <SelectItem value="دراسات اجتماعية">دراسات اجتماعية</SelectItem>
                    <SelectItem value="تربية فنية">تربية فنية</SelectItem>
                    <SelectItem value="تربية بدنية">تربية بدنية</SelectItem>
                    <SelectItem value="حاسب آلي">حاسب آلي</SelectItem>
                    <SelectItem value="الاقتصاد المنزلي">الاقتصاد المنزلي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy", { locale: ar })
                      ) : (
                        <span>اختر التاريخ</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                      modifiers={{
                        selected: selectedDate ? [selectedDate] : []
                      }}
                      modifiersStyles={{
                        selected: { backgroundColor: 'hsl(var(--primary))', color: 'white' }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classLevel">الحصة</Label>
                <Select value={classLevel} onValueChange={setClassLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحصة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">الحصة الأولى</SelectItem>
                    <SelectItem value="2">الحصة الثانية</SelectItem>
                    <SelectItem value="3">الحصة الثالثة</SelectItem>
                    <SelectItem value="4">الحصة الرابعة</SelectItem>
                    <SelectItem value="5">الحصة الخامسة</SelectItem>
                    <SelectItem value="6">الحصة السادسة</SelectItem>
                  </SelectContent>
                </Select>
                {selectedDate && classLevel && isSlotBooked(selectedDate, classLevel) && (
                  <p className="text-xs text-destructive">
                    هذه الحصة محجوزة في هذا التاريخ
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            لوحة الإدارة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
