"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLocale } from '@/contexts/locale';

export default function PrivacyPage() {
  const { locale } = useLocale();
  const isRtl = locale === 'he';

  return (
    <main className="min-h-screen bg-transparent px-4 py-12 sm:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F9FAFB] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isRtl ? 'חזרה לדף הבית' : 'Back to home'}
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#111827]/80 p-8 space-y-8">

          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB] mb-2">
              {isRtl ? 'מדיניות פרטיות' : 'Privacy Policy'}
            </h1>
            <p className="text-sm text-[#A1A1AA]">
              {isRtl ? 'עודכן לאחרונה: ינואר 2026' : 'Last updated: January 2026'}
            </p>
          </div>

          {isRtl ? (
            <div className="space-y-6 text-[#A1A1AA] leading-7 text-sm">
              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">1. כללי</h2>
                <p>Optimizio Performance ("השירות", "אנחנו") מחויבים להגנה על פרטיותכם. מדיניות זו מסבירה אילו נתונים אנו אוספים, כיצד אנו משתמשים בהם ואיך אנו מגנים עליהם.</p>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">2. מידע שאנו אוספים</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>פרטי חשבון: שם, כתובת אימייל, סיסמה מוצפנת.</li>
                  <li>נתוני שימוש: כתובות אתרים שנסרקו, תוצאות סריקות, היסטוריית ייצואים.</li>
                  <li>נתוני תשלום: מעובדים על ידי ספק תשלומים חיצוני — אנו לא שומרים פרטי כרטיס אשראי.</li>
                  <li>קובצי Cookie: לשמירת העדפות שפה ומצב התחברות.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">3. שימוש במידע</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>הפעלת השירות וביצוע סריקות.</li>
                  <li>שליחת עדכונים ושינויים בשירות.</li>
                  <li>שיפור אלגוריתמי הניתוח שלנו.</li>
                  <li>תמיכה טכנית ואבטחה.</li>
                </ul>
                <p className="mt-2">אנו לא מוכרים ולא משתפים את המידע שלכם עם צדדים שלישיים לצרכי שיווק.</p>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">4. שמירת מידע</h2>
                <p>נתוני חשבון נשמרים כל עוד החשבון פעיל. ניתן לבקש מחיקת החשבון ונתוניו בכל עת על ידי פנייה אלינו.</p>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">5. אבטחה</h2>
                <p>אנו משתמשים בהצפנה (HTTPS/TLS) להגנה על הנתונים בהעברה, וסיסמאות מוצפנות בעזרת bcrypt.</p>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">6. זכויותיכם (GDPR)</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>זכות לעיין במידע שנשמר עליכם.</li>
                  <li>זכות לתיקון מידע שגוי.</li>
                  <li>זכות למחיקה ("הזכות להישכח").</li>
                  <li>זכות להתנגד לעיבוד הנתונים.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">7. יצירת קשר</h2>
                <p>לשאלות בנוגע לפרטיות פנו אלינו ב: <a href="mailto:privacy@optimizio.co.il" className="text-violet-400 hover:underline">privacy@optimizio.co.il</a></p>
              </section>
            </div>
          ) : (
            <div className="space-y-6 text-[#A1A1AA] leading-7 text-sm">
              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">1. Overview</h2>
                <p>Optimizio Performance ("the Service", "we") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and how we protect it.</p>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">2. Information We Collect</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Account details: name, email address, encrypted password.</li>
                  <li>Usage data: scanned URLs, scan results, export history.</li>
                  <li>Payment data: processed by a third-party payment provider — we do not store card details.</li>
                  <li>Cookies: for language preferences and login state.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">3. How We Use Your Data</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Operating the service and running scans.</li>
                  <li>Sending service updates and notifications.</li>
                  <li>Improving our analysis algorithms.</li>
                  <li>Technical support and security.</li>
                </ul>
                <p className="mt-2">We do not sell or share your data with third parties for marketing purposes.</p>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">4. Data Retention</h2>
                <p>Account data is retained while the account is active. You may request account deletion at any time by contacting us.</p>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">5. Security</h2>
                <p>We use HTTPS/TLS encryption for data in transit, and passwords are hashed with bcrypt.</p>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">6. Your Rights (GDPR)</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Right to access data we hold about you.</li>
                  <li>Right to correction of inaccurate data.</li>
                  <li>Right to erasure ("right to be forgotten").</li>
                  <li>Right to object to data processing.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[#F9FAFB] font-semibold text-base mb-2">7. Contact</h2>
                <p>For privacy questions contact us at: <a href="mailto:privacy@optimizio.co.il" className="text-violet-400 hover:underline">privacy@optimizio.co.il</a></p>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
