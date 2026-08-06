import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "noreply@mama-anisa-library.com";
const RESEND_FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "نظام حجز المعلمين";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  teacherName: string;
  subject: string;
  date: string;
  classLevel: string;
}

const classLevelMap: { [key: string]: string } = {
  "1": "الحصة الأولى",
  "2": "الحصة الثانية",
  "3": "الحصة الثالثة",
  "4": "الحصة الرابعة",
  "5": "الحصة الخامسة",
  "6": "الحصة السادسة",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teacherName, subject, date, classLevel }: NotificationRequest = await req.json();

    // Create Supabase client to fetch supervisor email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch supervisor email from settings table
    const { data: settingData, error: settingError } = await supabase
      .from("settings")
      .select("setting_value")
      .eq("setting_key", "supervisor_email")
      .single();

    if (settingError) {
      console.error("Error fetching supervisor email:", settingError);
      throw new Error("Failed to fetch supervisor email");
    }

    const adminEmail = settingData.setting_value;
    console.log("Sending notification email to:", adminEmail);

    const classLevelText = classLevelMap[classLevel] || classLevel;

    const emailResponse = await resend.emails.send({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM}>`,
      to: [adminEmail],
      subject: "طلب حجز مكتبة جديد",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 24px;">طلب حجز مكتبة جديد</h1>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #334155; font-size: 18px; margin-bottom: 16px;">تفاصيل الطلب:</h2>
            
            <div style="margin-bottom: 12px;">
              <strong style="color: #475569;">اسم المعلم:</strong>
              <span style="color: #1e293b; margin-right: 8px;">${teacherName}</span>
            </div>
            
            <div style="margin-bottom: 12px;">
              <strong style="color: #475569;">المادة العلمية:</strong>
              <span style="color: #1e293b; margin-right: 8px;">${subject}</span>
            </div>
            
            <div style="margin-bottom: 12px;">
              <strong style="color: #475569;">التاريخ:</strong>
              <span style="color: #1e293b; margin-right: 8px;">${date}</span>
            </div>
            
            <div>
              <strong style="color: #475569;">الحصة:</strong>
              <span style="color: #1e293b; margin-right: 8px;">${classLevelText}</span>
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
            الرجاء تسجيل الدخول إلى لوحة الإدارة لمراجعة هذا الطلب.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);