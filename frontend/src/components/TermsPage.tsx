/**
 * TermsPage — Terms of Service
 * AODS Neural Core
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

const LAST_UPDATED = '13 Maret 2026';
const VERSION = '1.0';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
};

const SectionTitle = ({ num, children }: { num: string; children: React.ReactNode }) => (
  <motion.h2 variants={fadeUp} style={{
    fontFamily: 'monospace', fontWeight: 900, fontSize: 'clamp(15px,2vw,18px)',
    color: '#fca5a5', margin: '40px 0 14px', display: 'flex', alignItems: 'center', gap: 12,
    borderBottom: '1px solid rgba(239,68,68,0.12)', paddingBottom: 10,
  }}>
    <span style={{ fontFamily: 'monospace', color: '#ef4444', opacity: 0.6, fontSize: 12, minWidth: 28 }}>
      {num}
    </span>
    {children}
  </motion.h2>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <motion.p variants={fadeUp} style={{
    color: 'rgba(252,165,165,0.65)', fontSize: 14, lineHeight: 1.85,
    marginBottom: 14, fontFamily: 'sans-serif',
  }}>
    {children}
  </motion.p>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <motion.li variants={fadeUp} style={{
    color: 'rgba(252,165,165,0.6)', fontSize: 14, lineHeight: 1.8,
    marginBottom: 6, paddingLeft: 8,
    fontFamily: 'sans-serif',
  }}>
    {children}
  </motion.li>
);

export default function TermsPage() {
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{
      minHeight: '100vh', background: 'radial-gradient(ellipse at 30% 20%,#1a0505 0%,#0a0000 50%,#000 100%)',
      color: '#fff',
    }}>
      {/* Subtle star bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(239,68,68,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        opacity: 0.4,
      }} />

      {/* Nav bar */}
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
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.5)', letterSpacing: 1 }}>TERMS OF SERVICE</span>
        </div>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '6px 14px',
          color: '#f87171', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer',
          letterSpacing: 1,
        }}>
          <ArrowLeft style={{ width: 13, height: 13 }} />
          BACK
        </button>
      </div>

      {/* Content */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ position: 'relative', zIndex: 10, maxWidth: 780, margin: '0 auto', padding: '56px 24px 80px' }}
      >
        {/* Header */}
        <motion.div variants={fadeUp} style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 999, padding: '6px 16px' }}>
            <FileText style={{ width: 14, height: 14, color: '#ef4444' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#f87171', letterSpacing: 3 }}>LEGAL DOCUMENT</span>
          </div>
          <h1 style={{
            fontFamily: 'monospace', fontWeight: 900,
            fontSize: 'clamp(28px,5vw,44px)',
            background: 'linear-gradient(135deg,#fff,#fca5a5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 12px',
          }}>
            Terms of Service
          </h1>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(252,165,165,0.4)', letterSpacing: 2 }}>
            VERSI {VERSION} · BERLAKU SEJAK {LAST_UPDATED}
          </p>
          <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg,#ef4444,transparent)', marginTop: 16 }} />
        </motion.div>

        {/* Intro */}
        <Paragraph>
          Selamat datang di <strong style={{ color: '#fca5a5' }}>AODS — Autonomous Orchestration of Digital Systems</strong>, platform enterprise metaverse holografik yang dikembangkan oleh Ahmad Fashich Azzuhri Ramadhani untuk Mayar Vibecoding Competition 2026. Dengan mengakses atau menggunakan platform AODS, Anda menyetujui syarat dan ketentuan berikut secara penuh.
        </Paragraph>

        {/* Section 1 */}
        <SectionTitle num="01">Definisi dan Ruang Lingkup</SectionTitle>
        <Paragraph>
          "Platform AODS" mencakup seluruh layanan, antarmuka web, API, microservice, smart contract, dan fitur yang tersedia di domain AODS Neural Core, termasuk namun tidak terbatas pada:
        </Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet>Antarmuka 3D holografik berbasis Three.js dan WebGL</Bullet>
          <Bullet>Sistem autentikasi berbasis email dan MetaMask Web3</Bullet>
          <Bullet>Dashboard AI, blockchain, dan orkestrasi microservice</Bullet>
          <Bullet>API gateway dengan 8 microservice dalam 9 bahasa pemrograman</Bullet>
          <Bullet>Modul blockchain (9 smart contract berbasis Solidity & Hyperledger)</Bullet>
          <Bullet>Sistem gamifikasi, XP points, level, dan reward token</Bullet>
        </motion.ul>

        {/* Section 2 */}
        <SectionTitle num="02">Kelayakan Pengguna</SectionTitle>
        <Paragraph>
          Untuk menggunakan platform AODS, Anda harus:
        </Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet>Berusia minimal 17 tahun atau mendapat persetujuan wali yang sah</Bullet>
          <Bullet>Menyediakan informasi yang akurat dan terkini saat registrasi</Bullet>
          <Bullet>Bertanggung jawab atas keamanan kredensial akun Anda</Bullet>
          <Bullet>Tidak menggunakan platform untuk aktivitas ilegal atau merugikan pihak lain</Bullet>
          <Bullet>Mematuhi semua hukum dan regulasi yang berlaku di yurisdiksi Anda</Bullet>
        </motion.ul>

        {/* Section 3 */}
        <SectionTitle num="03">Penggunaan Platform yang Diizinkan</SectionTitle>
        <Paragraph>
          Anda diperbolehkan menggunakan AODS untuk:
        </Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet>Mengakses fitur dashboard dan visualisasi 3D</Bullet>
          <Bullet>Berinteraksi dengan AI assistant dan sistem orkestrasi</Bullet>
          <Bullet>Mengelola identitas digital dan wallet blockchain</Bullet>
          <Bullet>Menggunakan API endpoints untuk integrasi yang sah</Bullet>
          <Bullet>Berpartisipasi dalam sistem gamifikasi dan reward</Bullet>
        </motion.ul>

        {/* Section 4 */}
        <SectionTitle num="04">Larangan dan Pembatasan</SectionTitle>
        <Paragraph>Pengguna <strong style={{ color: '#f87171' }}>dilarang keras</strong> melakukan aktivitas berikut:</Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet>Reverse engineering, decompiling, atau disassembly komponen platform</Bullet>
          <Bullet>Melakukan serangan DDoS, SQL injection, atau eksploitasi keamanan lainnya</Bullet>
          <Bullet>Menggunakan bot, scraper, atau alat otomatis tanpa izin tertulis</Bullet>
          <Bullet>Memalsukan identitas atau mengimpersonasi pengguna lain</Bullet>
          <Bullet>Mendistribusikan malware, phishing, atau konten berbahaya melalui platform</Bullet>
          <Bullet>Melanggar hak kekayaan intelektual AODS atau pihak ketiga</Bullet>
          <Bullet>Memanipulasi sistem gamifikasi, XP, atau token reward dengan cara tidak sah</Bullet>
        </motion.ul>

        {/* Section 5 */}
        <SectionTitle num="05">Autentikasi dan Keamanan Akun</SectionTitle>
        <Paragraph>
          AODS menyediakan dua metode autentikasi: (1) email + password dengan enkripsi SHA-256 dan salt, serta (2) wallet MetaMask Web3. Anda bertanggung jawab penuh atas:
        </Paragraph>
        <motion.ul variants={stagger} style={{ paddingLeft: 24, margin: '0 0 16px' }}>
          <Bullet>Kerahasiaan password dan seed phrase MetaMask Anda</Bullet>
          <Bullet>Seluruh aktivitas yang terjadi di bawah akun Anda</Bullet>
          <Bullet>Segera melaporkan akses tidak sah ke tim keamanan AODS</Bullet>
        </motion.ul>
        <Paragraph>
          Sistem proteksi brute force aktif (maksimal 5 percobaan gagal / 15 menit). AODS menggunakan Row-Level Security (RLS) PostgreSQL dan enkripsi AES-256-GCM untuk data sensitif.
        </Paragraph>

        {/* Section 6 */}
        <SectionTitle num="06">Pembayaran dan Langganan</SectionTitle>
        <Paragraph>
          AODS menawarkan tiga tier langganan: Free, Pro (Rp 99.000/bulan), dan Enterprise (Rp 499.000/bulan). Pembayaran diproses melalui Mayar.id dan tunduk pada kebijakan pembayaran mereka. Refund hanya dapat diproses dalam 7 hari sejak transaksi untuk akun yang belum menggunakan fitur premium secara signifikan.
        </Paragraph>

        {/* Section 7 */}
        <SectionTitle num="07">Kekayaan Intelektual</SectionTitle>
        <Paragraph>
          Seluruh kode sumber, desain antarmuka, arsitektur sistem, smart contract, algoritma AI, dan aset 3D AODS adalah milik eksklusif Ahmad Fashich Azzuhri Ramadhani dan dilindungi oleh hak cipta serta hukum kekayaan intelektual yang berlaku. Pengguna tidak memperoleh hak kepemilikan apapun atas platform.
        </Paragraph>

        {/* Section 8 */}
        <SectionTitle num="08">Ketersediaan Layanan dan SLA</SectionTitle>
        <Paragraph>
          Tier Enterprise memperoleh jaminan uptime 99.9% (SLA). Tier Free dan Pro tidak memiliki jaminan uptime formal. AODS tidak bertanggung jawab atas kerugian yang disebabkan oleh downtime planned maintenance, force majeure, atau gangguan infrastruktur pihak ketiga (Vercel, Render, Neon.tech).
        </Paragraph>

        {/* Section 9 */}
        <SectionTitle num="09">Penghentian Layanan</SectionTitle>
        <Paragraph>
          AODS berhak menangguhkan atau menghapus akun yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya. Pengguna dapat menghapus akun mereka sendiri melalui menu Profile &gt; Settings. Data akun akan dihapus secara permanen dalam 30 hari setelah permintaan penghapusan.
        </Paragraph>

        {/* Section 10 */}
        <SectionTitle num="10">Batasan Tanggung Jawab</SectionTitle>
        <Paragraph>
          AODS tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, atau konsekuensial yang mungkin timbul dari penggunaan platform ini, termasuk kehilangan data, keuntungan, atau token blockchain. Platform disediakan "as-is" tanpa jaminan tersurat maupun tersirat.
        </Paragraph>

        {/* Section 11 */}
        <SectionTitle num="11">Perubahan Syarat</SectionTitle>
        <Paragraph>
          AODS berhak mengubah syarat layanan ini kapan saja. Perubahan material akan dinotifikasi melalui email atau banner dalam platform minimal 14 hari sebelum berlaku. Penggunaan berkelanjutan setelah perubahan berlaku dianggap sebagai persetujuan atas syarat baru.
        </Paragraph>

        {/* Section 12 */}
        <SectionTitle num="12">Hukum yang Berlaku</SectionTitle>
        <Paragraph>
          Syarat layanan ini tunduk pada dan ditafsirkan sesuai dengan hukum Republik Indonesia. Sengketa yang mungkin timbul akan diselesaikan melalui mediasi terlebih dahulu, kemudian melalui arbitrase di Jakarta sesuai ketentuan BANI.
        </Paragraph>

        {/* Contact box */}
        <motion.div variants={fadeUp} style={{
          marginTop: 48, padding: '24px 28px', borderRadius: 14,
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Shield style={{ width: 16, height: 16, color: '#ef4444' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#ef4444', letterSpacing: 2 }}>KONTAK</span>
          </div>
          <p style={{ color: 'rgba(252,165,165,0.55)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Pertanyaan seputar Terms of Service dapat dikirimkan kepada:<br />
            <strong style={{ color: '#fca5a5' }}>Ahmad Fashich Azzuhri Ramadhani</strong><br />
            Mayar Vibecoding Competition 2026 · AODS Neural Core
          </p>
        </motion.div>

        {/* Footer links */}
        <motion.div variants={fadeUp} style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(239,68,68,0.08)', display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/privacy" style={{ fontFamily: 'monospace', fontSize: 11, color: '#f87171', letterSpacing: 1 }}>Privacy Policy →</Link>
          <Link to="/signup" style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.4)', letterSpacing: 1 }}>Create Account</Link>
          <Link to="/login" style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.4)', letterSpacing: 1 }}>Sign In</Link>
          <Link to="/" style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.4)', letterSpacing: 1 }}>← Homepage</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
