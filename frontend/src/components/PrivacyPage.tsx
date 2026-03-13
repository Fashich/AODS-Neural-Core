/**
 * PrivacyPage — Privacy Policy
 * AODS Neural Core
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Eye, Database, Globe, Trash2 } from 'lucide-react';

const LAST_UPDATED = '13 Maret 2026';
const VERSION = '1.0';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.07 } } };

const SectionTitle = ({ num, icon: Icon, children }: { num: string; icon?: any; children: React.ReactNode }) => (
  <motion.h2 variants={fadeUp} style={{
    fontFamily: 'monospace', fontWeight: 900, fontSize: 'clamp(15px,2vw,18px)',
    color: '#fca5a5', margin: '40px 0 14px', display: 'flex', alignItems: 'center', gap: 12,
    borderBottom: '1px solid rgba(239,68,68,0.12)', paddingBottom: 10,
  }}>
    <span style={{ fontFamily: 'monospace', color: '#ef4444', opacity: 0.6, fontSize: 12, minWidth: 28 }}>{num}</span>
    {Icon && <Icon style={{ width: 16, height: 16, color: '#ef444480' }} />}
    {children}
  </motion.h2>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <motion.p variants={fadeUp} style={{ color: 'rgba(252,165,165,0.65)', fontSize: 14, lineHeight: 1.85, marginBottom: 14, fontFamily: 'sans-serif' }}>
    {children}
  </motion.p>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <motion.li variants={fadeUp} style={{ color: 'rgba(252,165,165,0.6)', fontSize: 14, lineHeight: 1.8, marginBottom: 6, paddingLeft: 8, fontFamily: 'sans-serif' }}>
    {children}
  </motion.li>
);

const InfoCard = ({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) => (
  <motion.div variants={fadeUp} style={{
    padding: '18px 22px', borderRadius: 12, marginBottom: 16,
    background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <Icon style={{ width: 14, height: 14, color: '#ef4444' }} />
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#ef4444', letterSpacing: 2 }}>{title}</span>
    </div>
    <ul style={{ paddingLeft: 18, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: 'rgba(252,165,165,0.55)', fontSize: 13, lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
      ))}
    </ul>
  </motion.div>
);

export default function PrivacyPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 70% 20%,#150505 0%,#0a0000 50%,#000 100%)',
      color: '#fff',
    }}>
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(239,68,68,0.05) 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.35 }} />

      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,1,1,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(239,68,68,0.12)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/images/logo.png" alt="AODS" style={{ width: 26, height: 26, objectFit: 'contain', filter: 'drop-shadow(0 0 6px #ef4444aa)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: '#fca5a5', letterSpacing: 2 }}>AODS</span>
          <span style={{ color: 'rgba(239,68,68,0.3)', fontSize: 12 }}>/</span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.5)', letterSpacing: 1 }}>PRIVACY POLICY</span>
        </div>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '6px 14px',
          color: '#f87171', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', letterSpacing: 1,
        }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> BACK
        </button>
      </div>

      {/* Content */}
      <motion.div variants={stagger} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 10, maxWidth: 780, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Header */}
        <motion.div variants={fadeUp} style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 999, padding: '6px 16px' }}>
            <Lock style={{ width: 14, height: 14, color: '#ef4444' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#f87171', letterSpacing: 3 }}>PRIVACY DOCUMENT</span>
          </div>
          <h1 style={{
            fontFamily: 'monospace', fontWeight: 900, fontSize: 'clamp(28px,5vw,44px)',
            background: 'linear-gradient(135deg,#fff,#fca5a5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 12px',
          }}>Privacy Policy</h1>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(252,165,165,0.4)', letterSpacing: 2 }}>
            VERSI {VERSION} · BERLAKU SEJAK {LAST_UPDATED}
          </p>
          <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg,#ef4444,transparent)', marginTop: 16 }} />
        </motion.div>

        <Paragraph>
          AODS — Autonomous Orchestration of Digital Systems berkomitmen untuk melindungi privasi dan keamanan data Anda. Kebijakan privasi ini menjelaskan secara transparan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda dalam platform AODS Neural Core.
        </Paragraph>

        {/* Section 1 */}
        <SectionTitle num="01" icon={Database}>Data yang Kami Kumpulkan</SectionTitle>
        <InfoCard icon={Eye} title="DATA YANG ANDA BERIKAN LANGSUNG" items={[
          'Nama tampilan (display name) dan username unik',
          'Alamat email untuk autentikasi dan notifikasi',
          'Password (disimpan dalam bentuk hash SHA-256 + salt, tidak pernah plaintext)',
          'Alamat wallet MetaMask (opsional, untuk integrasi Web3)',
          'Bio profil, website, dan handle media sosial (opsional)',
        ]} />
        <InfoCard icon={Globe} title="DATA YANG DIKUMPULKAN SECARA OTOMATIS" items={[
          'Alamat IP dan informasi sesi login (untuk keamanan dan anti-brute-force)',
          'User Agent browser dan sistem operasi',
          'Data telemetri penggunaan fitur (anonymous, agregat)',
          'Log aktivitas untuk audit keamanan dan compliance (ISO 27001, COBIT)',
          'Waktu dan tanggal akses terakhir',
        ]} />

        {/* Section 2 */}
        <SectionTitle num="02" icon={Lock}>Bagaimana Kami Menggunakan Data</SectionTitle>
        <Paragraph>Data yang kami kumpulkan digunakan secara eksklusif untuk:</Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet>Menyediakan layanan platform AODS dan fitur-fiturnya</Bullet>
          <Bullet>Autentikasi dan verifikasi identitas pengguna</Bullet>
          <Bullet>Keamanan: deteksi anomali, proteksi brute force, dan audit log</Bullet>
          <Bullet>Sistem gamifikasi (XP points, level, achievement tracking)</Bullet>
          <Bullet>Pemrosesan pembayaran melalui Mayar.id (kami tidak menyimpan data kartu)</Bullet>
          <Bullet>Penyempurnaan dan peningkatan kualitas platform</Bullet>
          <Bullet>Kepatuhan terhadap kewajiban hukum yang berlaku</Bullet>
        </motion.ul>
        <Paragraph>
          <strong style={{ color: '#fca5a5' }}>Kami tidak pernah</strong> menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga untuk keperluan pemasaran.
        </Paragraph>

        {/* Section 3 */}
        <SectionTitle num="03" icon={Lock}>Keamanan Data</SectionTitle>
        <Paragraph>AODS menerapkan standar keamanan tinggi untuk melindungi data Anda:</Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet>Password di-hash menggunakan SHA-256 dengan salt unik — tidak dapat di-decode</Bullet>
          <Bullet>Koneksi database menggunakan SSL/TLS dengan enkripsi AES-256-GCM</Bullet>
          <Bullet>Row-Level Security (RLS) PostgreSQL: setiap pengguna hanya dapat mengakses data miliknya</Bullet>
          <Bullet>Token sesi menggunakan secure random 48-byte dengan expiry 30 hari</Bullet>
          <Bullet>Brute force protection: akun terkunci setelah 5 percobaan gagal / 15 menit</Bullet>
          <Bullet>Audit log tersimpan untuk seluruh aksi sensitif (login, register, perubahan data)</Bullet>
          <Bullet>Infrastruktur di-host di Neon.tech (PostgreSQL) dan Render.com dengan enkripsi at-rest</Bullet>
        </motion.ul>

        {/* Section 4 */}
        <SectionTitle num="04" icon={Globe}>Penyimpanan dan Transfer Data</SectionTitle>
        <Paragraph>
          Data Anda disimpan di server Neon.tech (region ap-southeast-1, Singapura) dan Render.com. Dengan menggunakan platform AODS, Anda menyetujui penyimpanan dan pemrosesan data di lokasi-lokasi tersebut. Seluruh transfer data dienkripsi menggunakan HTTPS/TLS 1.3.
        </Paragraph>
        <Paragraph>
          Pihak ketiga yang menerima data terbatas (hanya data yang dibutuhkan untuk fungsinya):
        </Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet><strong style={{ color: '#fca5a5' }}>Mayar.id</strong> — pemrosesan pembayaran (data transaksi, email)</Bullet>
          <Bullet><strong style={{ color: '#fca5a5' }}>Neon.tech</strong> — penyimpanan database (data terenkripsi)</Bullet>
          <Bullet><strong style={{ color: '#fca5a5' }}>Render.com</strong> — hosting backend (IP, log server)</Bullet>
          <Bullet><strong style={{ color: '#fca5a5' }}>Vercel</strong> — hosting frontend (tidak ada data user)</Bullet>
        </motion.ul>

        {/* Section 5 */}
        <SectionTitle num="05">Cookie dan Penyimpanan Lokal</SectionTitle>
        <Paragraph>
          AODS menggunakan <strong style={{ color: '#fca5a5' }}>localStorage</strong> browser Anda untuk menyimpan:
        </Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet>Token sesi autentikasi (encrypted, kadaluarsa 30 hari)</Bullet>
          <Bullet>Preferensi UI (tema, bahasa) — tidak mengandung data pribadi sensitif</Bullet>
          <Bullet>Cache data pengguna untuk performa (dapat dihapus kapan saja)</Bullet>
        </motion.ul>
        <Paragraph>
          Kami tidak menggunakan tracking cookies pihak ketiga atau analytics yang mengidentifikasi Anda secara personal.
        </Paragraph>

        {/* Section 6 */}
        <SectionTitle num="06" icon={Trash2}>Hak-Hak Pengguna (Data Subject Rights)</SectionTitle>
        <Paragraph>Sesuai prinsip privasi yang kami anut, Anda berhak untuk:</Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet><strong style={{ color: '#fca5a5' }}>Akses</strong> — Melihat semua data pribadi yang kami simpan tentang Anda (via Profile &gt; Settings)</Bullet>
          <Bullet><strong style={{ color: '#fca5a5' }}>Koreksi</strong> — Memperbarui data yang tidak akurat kapan saja</Bullet>
          <Bullet><strong style={{ color: '#fca5a5' }}>Penghapusan</strong> — Meminta penghapusan akun dan data secara permanen</Bullet>
          <Bullet><strong style={{ color: '#fca5a5' }}>Portabilitas</strong> — Mengekspor data Anda dalam format JSON</Bullet>
          <Bullet><strong style={{ color: '#fca5a5' }}>Pembatasan</strong> — Membatasi cara kami memproses data Anda</Bullet>
          <Bullet><strong style={{ color: '#fca5a5' }}>Keberatan</strong> — Menolak pemrosesan data untuk tujuan tertentu</Bullet>
        </motion.ul>

        {/* Section 7 */}
        <SectionTitle num="07">Retensi Data</SectionTitle>
        <Paragraph>
          Data akun aktif disimpan selama akun Anda aktif. Setelah akun dihapus, data pribadi akan dihapus secara permanen dalam 30 hari, kecuali data yang diperlukan untuk kepatuhan hukum (audit log finansial disimpan selama 7 tahun sesuai regulasi). Data anonim dan agregat dapat disimpan lebih lama untuk keperluan analitik.
        </Paragraph>

        {/* Section 8 */}
        <SectionTitle num="08">Privasi Anak-Anak</SectionTitle>
        <Paragraph>
          Platform AODS tidak ditujukan untuk pengguna di bawah usia 17 tahun. Kami tidak dengan sengaja mengumpulkan data dari anak-anak. Jika kami mengetahui telah mengumpulkan data dari anak di bawah umur tanpa persetujuan orang tua, kami akan segera menghapus data tersebut.
        </Paragraph>

        {/* Section 9 */}
        <SectionTitle num="09">Pembaruan Kebijakan Privasi</SectionTitle>
        <Paragraph>
          Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan signifikan akan dinotifikasi melalui email terdaftar atau banner dalam aplikasi minimal 14 hari sebelum berlaku. Tanggal pembaruan terakhir selalu ditampilkan di bagian atas dokumen ini.
        </Paragraph>

        {/* Contact */}
        <motion.div variants={fadeUp} style={{
          marginTop: 48, padding: '24px 28px', borderRadius: 14,
          background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Lock style={{ width: 16, height: 16, color: '#ef4444' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#ef4444', letterSpacing: 2 }}>KONTAK PRIVASI</span>
          </div>
          <p style={{ color: 'rgba(252,165,165,0.55)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Untuk permintaan terkait privasi data Anda, hubungi:<br />
            <strong style={{ color: '#fca5a5' }}>Ahmad Fashich Azzuhri Ramadhani</strong><br />
            AODS Neural Core · Mayar Vibecoding Competition 2026<br />
            <span style={{ fontSize: 12, color: 'rgba(252,165,165,0.35)' }}>
              Waktu respons: maksimal 7 hari kerja
            </span>
          </p>
        </motion.div>

        {/* Footer links */}
        <motion.div variants={fadeUp} style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(239,68,68,0.08)', display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/terms" style={{ fontFamily: 'monospace', fontSize: 11, color: '#f87171', letterSpacing: 1 }}>Terms of Service →</Link>
          <Link to="/signup" style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.4)', letterSpacing: 1 }}>Create Account</Link>
          <Link to="/login" style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.4)', letterSpacing: 1 }}>Sign In</Link>
          <Link to="/" style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.4)', letterSpacing: 1 }}>← Homepage</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
