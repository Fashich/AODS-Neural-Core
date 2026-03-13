/**
 * LandingPage — AODS Neural Core
 * Full scroll-driven 3D experience — REVISED
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

// ── Language definitions ───────────────────────────────────

type LangKey = 'default' | 'id' | 'jv' | 'su' | 'bk' | 'ac' | 'en' | 'ja' | 'ko' | 'zh' | 'ru' | 'ar';

const LANGUAGES: { key: LangKey; label: string; native: string; flag: string }[] = [
  { key: 'default', label: 'Default',   native: 'Default',         flag: '🌐' },
  { key: 'id',      label: 'Indonesia', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { key: 'jv',      label: 'Jawa',      native: 'Basa Jawa',       flag: '\u2615' },
  { key: 'su',      label: 'Sunda',     native: 'Basa Sunda',      flag: '🌿' },
  { key: 'bk',      label: 'Batak',     native: 'Hata Batak',      flag: '🏔\uFE0F' },
  { key: 'ac',      label: 'Aceh',      native: 'Bahsa Aceh',      flag: '🌊' },
  { key: 'en',      label: 'English',   native: 'English',         flag: '🇺🇸' },
  { key: 'ja',      label: 'Japan',     native: '\u65E5\u672C\u8A9E',           flag: '🇯🇵' },
  { key: 'ko',      label: 'Korea',     native: '\uD55C\uAD6D\uC5B4',           flag: '🇰🇷' },
  { key: 'zh',      label: 'China',     native: '\u4E2D\u6587',               flag: '🇨🇳' },
  { key: 'ru',      label: 'Rusia',     native: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',          flag: '🇷🇺' },
  { key: 'ar',      label: 'Arab',      native: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',           flag: '🇸🇦' },
];

type LangDict = {
  badge: string; tagline: string; sub: string;
  watchTrailer: string; exploreUniverse: string; scroll: string;
  sectionMetrics: string; platformStats: string;
  sectionArch: string; archTitle: string;
  sectionInfra: string; infraTitle: string; infraSub: string;
  sectionCapabilities: string; capTitle: string;
  sectionJoin: string; joinTitle: string; joinSub: string;
  createAccount: string; signIn: string; pills: string[];
  footerTagline: string; footerCopyright: string; footerLinks: string[];
  langTitle: string;
};

const T: Record<LangKey, LangDict> = {
  default: {
    badge: 'A COMPREHENSIVE ENTERPRISE METAVERSE PLATFORM',
    tagline: 'Autonomous Orchestration of Digital Systems',
    sub: 'Platform enterprise generasi berikutnya - AI Agent, blockchain, dan visualisasi 3D holografik dalam satu ekosistem terintegrasi.',
    watchTrailer: 'Watch Trailer', exploreUniverse: 'Explore Universe', scroll: 'SCROLL',
    sectionMetrics: 'System Metrics', platformStats: 'Platform Statistics',
    sectionArch: 'Polyglot Architecture', archTitle: '9 Languages, 1 Ecosystem',
    sectionInfra: 'Live Infrastructure', infraTitle: 'Real-Time Infrastructure',
    infraSub: 'Monitor microservice health, compliance, dan system uptime secara real-time.',
    sectionCapabilities: 'Core Capabilities', capTitle: 'Platform Next-Gen',
    sectionJoin: 'Join AODS', joinTitle: 'Siap Memasuki\nHolographic Metaverse?',
    joinSub: 'Bergabunglah dengan AODS Neural Core — platform enterprise terdepan yang menggabungkan AI, blockchain, dan visualisasi 3D.',
    createAccount: 'Create Account', signIn: 'Sign In',
    pills: ['Free tier available', 'MetaMask supported', 'ISO 27001', '9 Languages', 'Open Source'],
    footerTagline: 'Platform enterprise generasi berikutnya — AI, blockchain, dan metaverse 3D dalam satu ekosistem.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 All rights reserved.',
    footerLinks: ['Features', 'Blockchain', 'AI Core', 'Documentation', 'Privacy Policy', 'Terms of Service'],
    langTitle: 'Choose Language',
  },
  id: {
    badge: 'PLATFORM METAVERSE ENTERPRISE KOMPREHENSIF',
    tagline: 'Orkestrasi Otonom Sistem Digital',
    sub: 'Platform enterprise generasi berikutnya \u2014 AI Agent, blockchain, dan visualisasi 3D holografik dalam satu ekosistem terintegrasi.',
    watchTrailer: 'Tonton Trailer', exploreUniverse: 'Jelajahi Universe', scroll: 'GULIR',
    sectionMetrics: 'Metrik Sistem', platformStats: 'Statistik Platform',
    sectionArch: 'Arsitektur Poliglot', archTitle: '9 Bahasa, 1 Ekosistem',
    sectionInfra: 'Infrastruktur Langsung', infraTitle: 'Infrastruktur Real-Time',
    infraSub: 'Pantau kesehatan microservice, kepatuhan, dan uptime sistem secara langsung.',
    sectionCapabilities: 'Kemampuan Inti', capTitle: 'Platform Generasi Baru',
    sectionJoin: 'Bergabung AODS', joinTitle: 'Siap Memasuki\nMetaverse Holografik?',
    joinSub: 'Bergabunglah dengan AODS Neural Core \u2014 platform enterprise terdepan yang memadukan AI, blockchain, dan visualisasi 3D.',
    createAccount: 'Buat Akun', signIn: 'Masuk',
    pills: ['Tier gratis tersedia', 'MetaMask didukung', 'ISO 27001', '9 Bahasa', 'Open Source'],
    footerTagline: 'Platform enterprise generasi berikutnya \u2014 AI, blockchain, dan metaverse 3D dalam satu ekosistem.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 Hak cipta dilindungi.',
    footerLinks: ['Fitur', 'Blockchain', 'AI Core', 'Dokumentasi', 'Kebijakan Privasi', 'Syarat Layanan'],
    langTitle: 'Pilih Bahasa',
  },
  jv: {
    badge: 'PLATFORM METAVERSE ENTERPRISE KOMPREHENSIF',
    tagline: 'Orkestrasi Otomatis Sistem Digital',
    sub: 'Platform enterprise generasi sabanjure \u2014 AI Agent, blockchain, lan visualisasi 3D holografik ing sak ekosistem terintegrasi.',
    watchTrailer: 'Delok Trailer', exploreUniverse: 'Jelajah Universe', scroll: 'GULUNG',
    sectionMetrics: 'Metrik Sistem', platformStats: 'Statistik Platform',
    sectionArch: 'Arsitektur Poliglot', archTitle: '9 Basa, 1 Ekosistem',
    sectionInfra: 'Infrastruktur Langsung', infraTitle: 'Infrastruktur Real-Time',
    infraSub: 'Pantau kesehatan microservice, kepatuhan, lan uptime sistem kanthi langsung.',
    sectionCapabilities: 'Kemampuan Inti', capTitle: 'Platform Generasi Anyar',
    sectionJoin: 'Gabung AODS', joinTitle: 'Siyap Mlebu\nMetaverse Holografik?',
    joinSub: 'Gabungo karo AODS Neural Core \u2014 platform enterprise paling maju sing nggabungake AI, blockchain, lan visualisasi 3D.',
    createAccount: 'Gawe Akun', signIn: 'Mlebu',
    pills: ['Tier gratis ana', 'MetaMask didhukung', 'ISO 27001', '9 Basa', 'Open Source'],
    footerTagline: 'Platform enterprise generasi anyar \u2014 AI, blockchain, lan metaverse 3D ing sak ekosistem.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 Hak cipta dilindungi.',
    footerLinks: ['Fitur', 'Blockchain', 'AI Core', 'Dokumentasi', 'Kabijakan Privasi', 'Syarat Layanan'],
    langTitle: 'Pilih Basa',
  },
  su: {
    badge: 'PLATFORM METAVERSE ENTERPRISE KOMPREHENSIF',
    tagline: 'Orkestrasi Otomatis Sistem Digital',
    sub: 'Platform enterprise generasi salajengna \u2014 AI Agent, blockchain, sareng visualisasi 3D holografik dina hiji ekosistem terintegrasi.',
    watchTrailer: 'Tingali Trailer', exploreUniverse: 'Jelajah Universe', scroll: 'GULUNG',
    sectionMetrics: 'Metrik Sistim', platformStats: 'Statistik Platform',
    sectionArch: 'Arsitektur Poliglot', archTitle: '9 Basa, 1 Ekosistim',
    sectionInfra: 'Infrastruktur Langsung', infraTitle: 'Infrastruktur Real-Time',
    infraSub: 'Pantau kaséhatan microservice, kapatuhan, sareng uptime sistim sacara langsung.',
    sectionCapabilities: 'Kamampuh Inti', capTitle: 'Platform Generasi Énggal',
    sectionJoin: 'Gabung AODS', joinTitle: 'Siap Asup\nMetaverse Holografik?',
    joinSub: 'Gabung sareng AODS Neural Core \u2014 platform enterprise pangmajuna anu ngahijikeun AI, blockchain, sareng visualisasi 3D.',
    createAccount: 'Jieun Akun', signIn: 'Asup',
    pills: ['Tier gratis aya', 'MetaMask dirojong', 'ISO 27001', '9 Basa', 'Open Source'],
    footerTagline: 'Platform enterprise generasi énggal \u2014 AI, blockchain, sareng metaverse 3D dina hiji ekosistim.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 Hak cipta dilindingan.',
    footerLinks: ['Fitur', 'Blockchain', 'AI Core', 'Dokumentasi', 'Kabijakan Privasi', 'Syarat Layanan'],
    langTitle: 'Pilih Basa',
  },
  bk: {
    badge: 'PLATFORM METAVERSE ENTERPRISE KOMPREHENSIF',
    tagline: 'Orkestrasion Otomatis Sistem Digital',
    sub: 'Platform enterprise generasi naposobulung \u2014 AI Agent, blockchain, dohot visualisasi 3D holografik di saada ekosistem na terintegrasi.',
    watchTrailer: 'Ida Trailer', exploreUniverse: 'Jelajah Universe', scroll: 'GULUNG',
    sectionMetrics: 'Metrik Sistem', platformStats: 'Statistik Platform',
    sectionArch: 'Arsitektur Poliglot', archTitle: '9 Hata, 1 Ekosistem',
    sectionInfra: 'Infrastruktur Langsung', infraTitle: 'Infrastruktur Real-Time',
    infraSub: 'Pantau roha microservice, patuhan, dohot uptime sistem langsung.',
    sectionCapabilities: 'Kemampuan Inti', capTitle: 'Platform Generasi Baru',
    sectionJoin: 'Masuk AODS', joinTitle: 'Siap Tama\nMetaverse Holografik?',
    joinSub: 'Masuk ma hamu tu AODS Neural Core \u2014 platform enterprise na ulubalang na manoktahi AI, blockchain, dohot visualisasi 3D.',
    createAccount: 'Patidaon Akun', signIn: 'Masuk',
    pills: ['Tier gratis adong', 'MetaMask disakkapkon', 'ISO 27001', '9 Hata', 'Open Source'],
    footerTagline: 'Platform enterprise generasi naposobulung \u2014 AI, blockchain, dohot metaverse 3D di saada ekosistem.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 Hak cipta dilindungi.',
    footerLinks: ['Fitur', 'Blockchain', 'AI Core', 'Dokumentasi', 'Kebijakan Privasi', 'Syarat Layanan'],
    langTitle: 'Pillit Hata',
  },
  ac: {
    badge: 'PLATFORM METAVERSE ENTERPRISE KOMPREHENSIF',
    tagline: 'Orkestrasion Otomatis Sistem Digital',
    sub: 'Platform enterprise generasi sateureuk \u2014 AI Agent, blockchain, dan visualisasi 3D holografik dalam saboh ekosistem terintegrasi.',
    watchTrailer: 'Kalon Trailer', exploreUniverse: 'Jelajah Universe', scroll: 'GULUNG',
    sectionMetrics: 'Metrik Sistém', platformStats: 'Statistik Platform',
    sectionArch: 'Arsitektur Poliglot', archTitle: '9 Bahsa, 1 Ekosistém',
    sectionInfra: 'Infrastruktur Langsung', infraTitle: 'Infrastruktur Real-Time',
    infraSub: 'Pantau késéhatan microservice, kepatuhan, dan uptime sistém secara langsung.',
    sectionCapabilities: 'Kemampuan Inti', capTitle: 'Platform Generasi Baro',
    sectionJoin: 'Gabong AODS', joinTitle: 'Siap Meuseuki\nMetaverse Holografik?',
    joinSub: 'Gabong ngon AODS Neural Core \u2014 platform enterprise teue yang meugabongkan AI, blockchain, dan visualisasi 3D.',
    createAccount: 'Buwat Akun', signIn: 'Masuk',
    pills: ['Tier gratis tersedia', 'MetaMask didhukong', 'ISO 27001', '9 Bahsa', 'Open Source'],
    footerTagline: 'Platform enterprise generasi baro \u2014 AI, blockchain, dan metaverse 3D dalam saboh ekosistém.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 Hak cipta dilindungi.',
    footerLinks: ['Fitur', 'Blockchain', 'AI Core', 'Dokumentasi', 'Kebijakan Privasi', 'Syarat Layanan'],
    langTitle: 'Pilèh Bahsa',
  },
  en: {
    badge: 'A COMPREHENSIVE ENTERPRISE METAVERSE PLATFORM',
    tagline: 'Autonomous Orchestration of Digital Systems',
    sub: 'The next-generation enterprise platform \u2014 AI Agents, blockchain, and holographic 3D visualization in one integrated ecosystem.',
    watchTrailer: 'Watch Trailer', exploreUniverse: 'Explore Universe', scroll: 'SCROLL',
    sectionMetrics: 'System Metrics', platformStats: 'Platform Statistics',
    sectionArch: 'Polyglot Architecture', archTitle: '9 Languages, 1 Ecosystem',
    sectionInfra: 'Live Infrastructure', infraTitle: 'Real-Time Infrastructure',
    infraSub: 'Monitor microservice health, compliance scores, and system uptime in real-time.',
    sectionCapabilities: 'Core Capabilities', capTitle: 'Next-Gen Platform',
    sectionJoin: 'Join AODS', joinTitle: 'Ready to Enter the\nHolographic Metaverse?',
    joinSub: 'Join AODS Neural Core \u2014 the leading enterprise platform unifying AI, blockchain, and 3D visualization.',
    createAccount: 'Create Account', signIn: 'Sign In',
    pills: ['Free tier available', 'MetaMask supported', 'ISO 27001', '9 Languages', 'Open Source'],
    footerTagline: 'The next-generation enterprise platform \u2014 AI, blockchain, and 3D metaverse in one ecosystem.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 All rights reserved.',
    footerLinks: ['Features', 'Blockchain', 'AI Core', 'Documentation', 'Privacy Policy', 'Terms of Service'],
    langTitle: 'Choose Language',
  },
  ja: {
    badge: '\u5305\u62EC\u7684\u306A\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA\u30E1\u30BF\u30D0\u30FC\u30B9\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0',
    tagline: '\u30C7\u30B8\u30BF\u30EB\u30B7\u30B9\u30C6\u30E0\u306E\u81EA\u5F8B\u30AA\u30FC\u30B1\u30B9\u30C8\u30EC\u30FC\u30B7\u30E7\u30F3',
    sub: '\u6B21\u4E16\u4EE3\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0 \u2014 AI\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u3001\u30D6\u30ED\u30C3\u30AF\u30C1\u30A7\u30FC\u30F3\u3001\u30DB\u30ED\u30B0\u30E9\u30D5\u30A3\u30C3\u30AF3D\u30D3\u30B8\u30E5\u30A2\u30E9\u30A4\u30BC\u30FC\u30B7\u30E7\u30F3\u3092\u7D71\u5408\u3057\u305F\u30A8\u30B3\u30B7\u30B9\u30C6\u30E0\u3002',
    watchTrailer: '\u30C8\u30EC\u30FC\u30E9\u30FC\u3092\u898B\u308B', exploreUniverse: '\u30E6\u30CB\u30D0\u30FC\u30B9\u3092\u63A2\u7D22', scroll: '\u30B9\u30AF\u30ED\u30FC\u30EB',
    sectionMetrics: '\u30B7\u30B9\u30C6\u30E0\u30E1\u30C8\u30EA\u30AF\u30B9', platformStats: '\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u7D71\u8A08',
    sectionArch: '\u30DD\u30EA\u30B0\u30ED\u30C3\u30C8\u30A2\u30FC\u30AD\u30C6\u30AF\u30C1\u30E3', archTitle: '9\u8A00\u8A9E\u30011\u30A8\u30B3\u30B7\u30B9\u30C6\u30E0',
    sectionInfra: '\u30E9\u30A4\u30D6\u30A4\u30F3\u30D5\u30E9', infraTitle: '\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u30A4\u30F3\u30D5\u30E9',
    infraSub: '\u30DE\u30A4\u30AF\u30ED\u30B5\u30FC\u30D3\u30B9\u306E\u5065\u5168\u6027\u3001\u30B3\u30F3\u30D7\u30E9\u30A4\u30A2\u30F3\u30B9\u3001\u30B7\u30B9\u30C6\u30E0\u7A3C\u50CD\u6642\u9593\u3092\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u3067\u76E3\u8996\u3002',
    sectionCapabilities: '\u30B3\u30A2\u6A5F\u80FD', capTitle: '\u6B21\u4E16\u4EE3\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0',
    sectionJoin: 'AODS\u306B\u53C2\u52A0', joinTitle: '\u30DB\u30ED\u30B0\u30E9\u30D5\u30A3\u30C3\u30AF\u30E1\u30BF\u30D0\u30FC\u30B9\u3078\u306E\n\u53C2\u52A0\u6E96\u5099\u306F\u3067\u304D\u3066\u3044\u307E\u3059\u304B\uff1f',
    joinSub: 'AODS Neural Core\u306B\u53C2\u52A0\u3057\u307E\u3057\u3087\u3046 \u2014 AI\u3001\u30D6\u30ED\u30C3\u30AF\u30C1\u30A7\u30FC\u30F3\u3001\u30B7\u30B9\u30C6\u30E0\u306E\u81EA\u5F8B\u30AA\u30FC\u30B1\u30B9\u30C8\u30EC\u30FC\u30B7\u30E7\u30F3\u3092\u7D71\u5408\u3057\u305F\u6700\u5148\u7AEF\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3002',
    createAccount: '\u30A2\u30AB\u30A6\u30F3\u30C8\u4F5C\u6210', signIn: '\u30B5\u30A4\u30F3\u30A4\u30F3',
    pills: ['\u7121\u6599\u30D7\u30E9\u30F3\u3042\u308A', 'MetaMask\u5BFE\u5FDC', 'ISO 27001', '9\u8A00\u8A9E', '\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9'],
    footerTagline: '\u6B21\u4E16\u4EE3\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0 \u2014 AI\u3001\u30D6\u30ED\u30C3\u30AF\u30C1\u30A7\u30FC\u30F3\u3001\u30B13D\u30E1\u30BF\u30D0\u30FC\u30B91\u3064\u306E\u30A8\u30B3\u30B7\u30B9\u30C6\u30E0\u3067\u3002',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 \u5168\u8457\u4F5C\u6A29\u6240\u6709\u3002',
    footerLinks: ['\u6A5F\u80FD', '\u30D6\u30ED\u30C3\u30AF\u30C1\u30A7\u30FC\u30F3', 'AI\u30B3\u30A2', '\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8', '\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC', '\u5229\u7528\u898F\u7D04'],
    langTitle: '\u8A00\u8A9E\u3092\u9078\u629E',
  },
  ko: {
    badge: '\uC885\uD569 \uC5D4\uD130\uD504\uB77C\uC774\uC988 \uBA54\uD0C0\uBC84\uC2A4 \uD50C\uB7AB\uD3FC',
    tagline: '\uB514\uC9C0\uD138 \uC2DC\uC2A4\uD15C\uC758 \uC790\uC728 \uC624\uCF00\uC2A4\uD2B8\uB808\uC774\uC158',
    sub: '\uCC28\uC138\uB300 \uC5D4\uD130\uD504\uB77C\uC774\uC988 \uD50C\uB7AB\uD3FC \u2014 AI \uC5D0\uC774\uC804\uD2B8, \uBE14\uB85D\uCCB4\uC778, \uD640\uB85C\uADF8\uB798\uD53D 3D \uC2DC\uAC01\uD654\uB97C \uD558\uB098\uC758 \uD1B5\uD569 \uC0DD\uD0DC\uACC4\uB85C.',
    watchTrailer: '\uD2B8\uB808\uC77C\uB7EC \uBCF4\uAE30', exploreUniverse: '\uC720\uB2C8\uBC84\uC2A4 \uD0D0\uD5D8', scroll: '\uC2A4\uD06C\uB864',
    sectionMetrics: '\uC2DC\uC2A4\uD15C \uBA54\uD2B8\uB9AD', platformStats: '\uD50C\uB7AB\uD3FC \uD1B5\uACC4',
    sectionArch: '\uD3F4\uB9AC\uAE00\uB7AD \uC544\uD0A4\uD14D\uCC98', archTitle: '9\uAC1C \uC5B8\uC5B4, 1\uAC1C \uC0DD\uD0DC\uACC4',
    sectionInfra: '\uB77C\uC774\uBE0C \uC778\uD504\uB77C', infraTitle: '\uC2E4\uC2DC\uAC04 \uC778\uD504\uB77C',
    infraSub: '\uB9C8\uC774\uD06C\uB85C\uC11C\uBE44\uC2A4 \uC0C1\uD0DC, \uCEF4\uD50C\uB77C\uC774\uC5B8\uC2A4, \uC2DC\uC2A4\uD15C \uAC00\uB3D9\uC728\uC744 \uC2E4\uC2DC\uAC04\uC73C\uB85C \uBAA8\uB2C8\uD130\uB9C1.',
    sectionCapabilities: '\uD575\uC2EC \uAE30\uB2A5', capTitle: '\uCC28\uC138\uB300 \uD50C\uB7AB\uD3FC',
    sectionJoin: 'AODS \uCC38\uC5EC', joinTitle: '\uD640\uB85C\uADF8\uB798\uD53D \uBA54\uD0C0\uBC84\uC2A4\uC5D0\n\uB4E4\uC5B4\uAC08 \uC900\uBE44\uAC00 \uB418\uC168\uB098\uC694?',
    joinSub: 'AODS Neural Core\uC5D0 \uCC38\uC5EC\uD558\uC138\uC694 \u2014 AI, \uBE14\uB85D\uCCB4\uC778, 3D \uC2DC\uAC01\uD654\uB97C \uD1B5\uD569\uD55C \uCD5C\uCCA8\uB2E8 \uC5D4\uD130\uD504\uB77C\uC774\uC988 \uD50C\uB7AB\uD3FC.',
    createAccount: '\uACC4\uC815 \uB9CC\uB4E4\uAE30', signIn: '\uB85C\uADF8\uC778',
    pills: ['\uBB34\uB8CC \uD50C\uB79C \uC81C\uACF5', 'MetaMask \uC9C0\uC6D0', 'ISO 27001', '9\uAC1C \uC5B8\uC5B4', '\uC624\uD508 \uC18C\uC2A4'],
    footerTagline: '\uCC28\uC138\uB300 \uC5D4\uD130\uD504\uB77C\uC774\uC988 \uD50C\uB7AB\uD3FC \u2014 AI, \uBE14\uB85D\uCCB4\uC778, 3D \uBA54\uD0C0\uBC84\uC2A4\uB97C \uD558\uB098\uC758 \uC0DD\uD0DC\uACC4\uB85C.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 \uBAA8\uB4E0 \uAD8C\uB9AC \uBCF4\uC720.',
    footerLinks: ['\uAE30\uB2A5', '\uBE14\uB85D\uCCB4\uC778', 'AI \uCF54\uC5B4', '\uBB38\uC11C', '\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68', '\uC774\uC6A9\uC57D\uAD00'],
    langTitle: '\uC5B8\uC5B4 \uC120\uD0DD',
  },
  zh: {
    badge: '\u5168\u9762\u7684\u4F01\u4E1A\u5143\u5B87\u5B99\u5E73\u53F0',
    tagline: '\u6570\u5B57\u7CFB\u7EDF\u7684\u81EA\u4E3B\u7F16\u6392',
    sub: '\u4E0B\u4E00\u4EE3\u4F01\u4E1A\u5E73\u53F0 \u2014 AI\u4EE3\u7406\u3001\u533A\u5757\u94FE\u548C\u5168\u606F3D\u53EF\u89C6\u5316\uFF0C\u878D\u5408\u4E8E\u4E00\u4E2A\u96C6\u6210\u751F\u6001\u7CFB\u7EDF\u4E2D\u3002',
    watchTrailer: '\u89C2\u770B\u9884\u544A\u7247', exploreUniverse: '\u63A2\u7D22\u5B87\u5B99', scroll: '\u6EDA\u52A8',
    sectionMetrics: '\u7CFB\u7EDF\u6307\u6807', platformStats: '\u5E73\u53F0\u7EDF\u8BA1',
    sectionArch: '\u591A\u8BED\u8A00\u67B6\u6784', archTitle: '9\u79CD\u8BED\u8A00\uFF0C1\u4E2A\u751F\u6001\u7CFB\u7EDF',
    sectionInfra: '\u5B9E\u65F6\u57FA\u7840\u8BBE\u65BD', infraTitle: '\u5B9E\u65F6\u57FA\u7840\u8BBE\u65BD',
    infraSub: '\u5B9E\u65F6\u76D1\u63A7\u5FAE\u670D\u52A1\u5065\u5EB7\u72B6\u51B5\u3001\u5408\u89C4\u8BC4\u5206\u548C\u7CFB\u7EDF\u6B63\u5E38\u8FD0\u884C\u65F6\u95F4\u3002',
    sectionCapabilities: '\u6838\u5FC3\u80FD\u529B', capTitle: '\u4E0B\u4E00\u4EE3\u5E73\u53F0',
    sectionJoin: '\u52A0\u5165AODS', joinTitle: '\u51C6\u5907\u597D\u8FDB\u5165\n\u5168\u606F\u5143\u5B87\u5B99\u4E86\u5417\uFF1F',
    joinSub: '\u52A0\u5165AODS Neural Core \u2014 \u9886\u5148\u7684\u4F01\u4E1A\u5E73\u53F0\uFF0C\u6574\u5408AI\u3001\u533A\u5757\u94FE\u548C3D\u53EF\u89C6\u5316\u3002',
    createAccount: '\u521B\u5EFA\u8D26\u6237', signIn: '\u767B\u5F55',
    pills: ['\u63D0\u4F9B\u514D\u8D39\u5C42', 'MetaMask\u652F\u6301', 'ISO 27001', '9\u79CD\u8BED\u8A00', '\u5F00\u6E90'],
    footerTagline: '\u4E0B\u4E00\u4EE3\u4F01\u4E1A\u5E73\u53F0 \u2014 AI\u3001\u533A\u5757\u94FE\u548C3D\u5143\u5B87\u5B99\u878D\u5408\u4E8E\u4E00\u4E2A\u751F\u6001\u7CFB\u7EDF\u3002',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002',
    footerLinks: ['\u529F\u80FD', '\u533A\u5757\u94FE', 'AI\u6838\u5FC3', '\u6587\u6863', '\u9690\u79C1\u653F\u7B56', '\u670D\u52A1\u6761\u6B3E'],
    langTitle: '\u9009\u62E9\u8BED\u8A00',
  },
  ru: {
    badge: '\u041A\u041E\u041C\u041F\u041B\u0415\u041A\u0421\u041D\u0410\u042F \u041A\u041E\u0420\u041F\u041E\u0420\u0410\u0422\u0418\u0412\u041D\u0410\u042F \u041C\u0415\u0422\u0410\u0412\u0421\u0415\u041B\u0415\u041D\u041D\u0410\u042F',
    tagline: '\u0410\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u0430\u044F \u041E\u0440\u043A\u0435\u0441\u0442\u0440\u043E\u0432\u043A\u0430 \u0426\u0438\u0444\u0440\u043E\u0432\u044B\u0445 \u0421\u0438\u0441\u0442\u0435\u043C',
    sub: '\u041A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u0430\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0433\u043E \u043F\u043E\u043A\u043E\u043B\u0435\u043D\u0438\u044F \u2014 \u0418\u0418-\u0430\u0433\u0435\u043D\u0442\u044B, \u0431\u043B\u043E\u043A\u0447\u0435\u0439\u043D \u0438 \u0433\u043E\u043B\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u0435\u0441\u043A\u0430\u044F 3D-\u0432\u0438\u0437\u0443\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u0432 \u0435\u0434\u0438\u043D\u043E\u0439 \u0438\u043D\u0442\u0435\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0439 \u044D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C\u0435.',
    watchTrailer: '\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0442\u0440\u0435\u0439\u043B\u0435\u0440', exploreUniverse: '\u0418\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u0442\u044C \u0432\u0441\u0435\u043B\u0435\u043D\u043D\u0443\u044E', scroll: '\u041F\u0420\u041E\u041A\u0420\u0423\u0422\u0418\u0422\u042C',
    sectionMetrics: '\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u043C\u0435\u0442\u0440\u0438\u043A\u0438', platformStats: '\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B',
    sectionArch: '\u041F\u043E\u043B\u0438\u0433\u043B\u043E\u0442\u043D\u0430\u044F \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0430', archTitle: '9 \u044F\u0437\u044B\u043A\u043E\u0432, 1 \u044D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C\u0430',
    sectionInfra: '\u0416\u0438\u0432\u0430\u044F \u0438\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430', infraTitle: '\u0418\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438',
    infraSub: '\u041C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433 \u0440\u0430\u0431\u043E\u0442\u043E\u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u043C\u0438\u043A\u0440\u043E\u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432, \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u044F \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u043C \u0438 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0431\u0435\u0437\u043E\u0442\u043A\u0430\u0437\u043D\u043E\u0439 \u0440\u0430\u0431\u043E\u0442\u044B.',
    sectionCapabilities: '\u041E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0438', capTitle: '\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u043D\u043E\u0432\u043E\u0433\u043E \u043F\u043E\u043A\u043E\u043B\u0435\u043D\u0438\u044F',
    sectionJoin: '\u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C\u0441\u044F \u043A AODS', joinTitle: '\u0413\u043E\u0442\u043E\u0432\u044B \u0432\u043E\u0439\u0442\u0438 \u0432\n\u0433\u043E\u043B\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u043C\u0435\u0442\u0430\u0432\u0441\u0435\u043B\u0435\u043D\u043D\u0443\u044E?',
    joinSub: '\u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0439\u0442\u0435\u0441\u044C \u043A AODS Neural Core \u2014 \u0432\u0435\u0434\u0443\u0449\u0435\u0439 \u043A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u043E\u0439 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435, \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u044F\u044E\u0449\u0435\u0439 \u0418\u0418, \u0431\u043B\u043E\u043A\u0447\u0435\u0439\u043D \u0438 3D-\u0432\u0438\u0437\u0443\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044E.',
    createAccount: '\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442', signIn: '\u0412\u043E\u0439\u0442\u0438',
    pills: ['\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C', 'MetaMask \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F', 'ISO 27001', '9 \u044F\u0437\u044B\u043A\u043E\u0432', '\u041E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043A\u043E\u0434'],
    footerTagline: '\u041A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u0430\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0433\u043E \u043F\u043E\u043A\u043E\u043B\u0435\u043D\u0438\u044F \u2014 \u0418\u0418, \u0431\u043B\u043E\u043A\u0447\u0435\u0439\u043D \u0438 3D-\u043C\u0435\u0442\u0430\u0432\u0441\u0435\u043B\u0435\u043D\u043D\u0430\u044F \u0432 \u0435\u0434\u0438\u043D\u043E\u0439 \u044D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C\u0435.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 \u0412\u0441\u0435 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u044B.',
    footerLinks: ['\u0424\u0443\u043D\u043A\u0446\u0438\u0438', '\u0411\u043B\u043E\u043A\u0447\u0435\u0439\u043D', '\u0418\u0418-\u044F\u0434\u0440\u043E', '\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u044F', '\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438', '\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F'],
    langTitle: '\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u044F\u0437\u044B\u043A',
  },
  ar: {
    badge: '\u0645\u0646\u0635\u0629 \u0645\u064A\u062A\u0627\u0641\u064A\u0631\u0633 \u0645\u0624\u0633\u0633\u064A\u0629 \u0634\u0627\u0645\u0644\u0629',
    tagline: '\u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0630\u0627\u062A\u064A \u0644\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629',
    sub: '\u0645\u0646\u0635\u0629 \u0645\u0624\u0633\u0633\u064A\u0629 \u0645\u0646 \u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u0642\u0627\u062F\u0645 \u2014 \u0648\u0643\u0644\u0627\u0621 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u0627\u0644\u0628\u0644\u0648\u0643\u062A\u0634\u064A\u0646 \u0648\u0627\u0644\u062A\u0635\u0648\u0631 \u0627\u0644\u0645\u062C\u0633\u0645 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0641\u064A \u0646\u0638\u0627\u0645 \u0628\u064A\u0626\u064A \u0645\u062A\u0643\u0627\u0645\u0644.',
    watchTrailer: '\u0634\u0627\u0647\u062F \u0627\u0644\u0645\u0642\u0637\u0639 \u0627\u0644\u062A\u0631\u0648\u064A\u062C\u064A', exploreUniverse: '\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0643\u0648\u0646', scroll: '\u0645\u0631\u0631',
    sectionMetrics: '\u0645\u0642\u0627\u064A\u064A\u0633 \u0627\u0644\u0646\u0638\u0627\u0645', platformStats: '\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629',
    sectionArch: '\u0628\u0646\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u0644\u063A\u0627\u062A', archTitle: '9 \u0644\u063A\u0627\u062A\u060C \u0646\u0638\u0627\u0645 \u0628\u064A\u0626\u064A \u0648\u0627\u062D\u062F',
    sectionInfra: '\u0627\u0644\u0628\u0646\u064A\u0629 \u0627\u0644\u062A\u062D\u062A\u064A\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629', infraTitle: '\u0627\u0644\u0628\u0646\u064A\u0629 \u0627\u0644\u062A\u062D\u062A\u064A\u0629 \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0641\u0639\u0644\u064A',
    infraSub: '\u0645\u0631\u0627\u0642\u0628\u0629 \u0635\u062D\u0629 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u0635\u063A\u0631\u0629 \u0648\u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0648\u0648\u0642\u062A \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0646\u0638\u0627\u0645 \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0641\u0639\u0644\u064A.',
    sectionCapabilities: '\u0627\u0644\u0642\u062F\u0631\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629', capTitle: '\u0645\u0646\u0635\u0629 \u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u0642\u0627\u062F\u0645',
    sectionJoin: '\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 AODS', joinTitle: '\u0647\u0644 \u0623\u0646\u062A \u0645\u0633\u062A\u0639\u062F \u0644\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649\n\u0627\u0644\u0645\u064A\u062A\u0627\u0641\u064A\u0631\u0633 \u0627\u0644\u0645\u062C\u0633\u0645\u061F',
    joinSub: '\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 AODS Neural Core \u2014 \u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u0644\u0631\u0627\u0626\u062F\u0629 \u0627\u0644\u062A\u064A \u062A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u0627\u0644\u0628\u0644\u0648\u0643\u062A\u0634\u064A\u0646 \u0648\u0627\u0644\u062A\u0635\u0648\u0631 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F.',
    createAccount: '\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628', signIn: '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644',
    pills: ['\u0645\u0633\u062A\u0648\u0649 \u0645\u062C\u0627\u0646\u064A \u0645\u062A\u0627\u062D', 'MetaMask \u0645\u062F\u0639\u0648\u0645', 'ISO 27001', '9 \u0644\u063A\u0627\u062A', '\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631'],
    footerTagline: '\u0645\u0646\u0635\u0629 \u0645\u0624\u0633\u0633\u064A\u0629 \u0645\u0646 \u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u0642\u0627\u062F\u0645 \u2014 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u0627\u0644\u0628\u0644\u0648\u0643\u062A\u0634\u064A\u0646 \u0648\u0627\u0644\u0645\u064A\u062A\u0627\u0641\u064A\u0631\u0633 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0641\u064A \u0646\u0638\u0627\u0645 \u0628\u064A\u0626\u064A \u0648\u0627\u062D\u062F.',
    footerCopyright: '\u00A9 2026 AODS Neural Core \u00B7 Ahmad Fashich Azzuhri Ramadhani \u00B7 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629.',
    footerLinks: ['\u0627\u0644\u0645\u064A\u0632\u0627\u062A', '\u0627\u0644\u0628\u0644\u0648\u0643\u062A\u0634\u064A\u0646', '\u0646\u0648\u0627\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A', '\u0627\u0644\u062A\u0648\u062B\u064A\u0642', '\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629', '\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u062F\u0645\u0629'],
    langTitle: '\u0627\u062E\u062A\u0631 \u0627\u0644\u0644\u063A\u0629',
  },
};

// ── CSS injected once ─────────────────────────────────────

const GLOBAL_CSS = `
@keyframes lp-spin    { to { transform: rotate(360deg); } }
@keyframes lp-rspin   { to { transform: rotate(-360deg); } }
@keyframes lp-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes lp-beam    { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes lp-ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes lp-shimmer { 0%{background-position:-300% center} 100%{background-position:300% center} }
@keyframes lp-scanline { 0%,100%{top:0%} 100%{top:100%} }
@keyframes lp-glyph   { 0%,100%{opacity:.2} 50%{opacity:.7} }
@keyframes lp-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes lp-orb     {
  0%  { box-shadow: 0 0 30px #ef444440, inset 0 0 30px #ef444415; }
  50% { box-shadow: 0 0 80px #ef444480, inset 0 0 60px #ef444430; }
  100%{ box-shadow: 0 0 30px #ef444440, inset 0 0 30px #ef444415; }
}
.lp-shimmer-text {
  background: linear-gradient(90deg,#fff 0%,#fca5a5 25%,#ef4444 50%,#fca5a5 75%,#fff 100%);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: lp-shimmer 6s linear infinite;
}
.lp-card-hover {
  transition: border-color .25s, box-shadow .25s, transform .15s;
}
.lp-card-hover:hover {
  border-color: rgba(239,68,68,.4) !important;
  box-shadow: 0 8px 40px rgba(239,68,68,.12), 0 0 0 1px rgba(239,68,68,.1) !important;
  transform: translateY(-3px);
}
`;

// ── Three.js: OrbDot ──────────────────────────────────────

const OrbDot = ({ angle, radius, speed }: { angle: number; radius: number; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + angle;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 0.7) * 0.6, Math.sin(t) * radius);
  });
  return <mesh ref={ref}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#fca5a5" /></mesh>;
};

// ── Three.js: NeuralOrb (scroll-reactive) ─────────────────

const NeuralOrb = ({ scrollY = 0 }: { scrollY?: number }) => {
  const coreRef   = useRef<THREE.Mesh>(null);
  const ringRef   = useRef<THREE.Group>(null);
  const groupRef  = useRef<THREE.Group>(null);
  const scrollRef = useRef(scrollY);
  scrollRef.current = scrollY;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const sy = scrollRef.current;
    if (coreRef.current) {
      coreRef.current.rotation.x = t * 0.14;
      coreRef.current.rotation.y = t * 0.19;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.28;
      ringRef.current.rotation.z = t * 0.09;
    }
    if (groupRef.current) {
      // scroll: move up + shrink + rotate
      groupRef.current.position.y = -sy * 0.006;
      groupRef.current.rotation.y = sy * 0.0015;
      const s = Math.max(1 - sy * 0.0004, 0.3);
      groupRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[2.1, 1]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.5} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[2.15, 1]} />
        <meshBasicMaterial color="#f87171" wireframe transparent opacity={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.7, 32, 32]} />
        <MeshDistortMaterial color="#ef4444" transparent opacity={0.07} speed={2} distort={0.3} />
      </mesh>
      <group ref={ringRef}>
        {([
          [3.4, 0.04, Math.PI / 2, 0,           '#ef4444', 0.7],
          [3.9, 0.03, Math.PI / 3, Math.PI / 4, '#f87171', 0.5],
          [4.4, 0.02, Math.PI / 6, Math.PI / 2, '#fca5a5', 0.3],
        ] as [number,number,number,number,string,number][]).map(([r,t,rx,ry,col,op], i) => (
          <mesh key={i} rotation={[rx, ry, 0]}>
            <torusGeometry args={[r, t, 16, 100]} />
            <meshBasicMaterial color={col} transparent opacity={op} />
          </mesh>
        ))}
      </group>
      {Array.from({ length: 8 }).map((_, i) => (
        <OrbDot key={i} angle={(i / 8) * Math.PI * 2} radius={3.4} speed={0.4 + i * 0.04} />
      ))}
      <pointLight position={[0,0,0]} intensity={3} color="#ef4444" distance={12} decay={2} />
    </group>
  );
};

// ── Hacker Text Cloud ────────────────────────────────────

const HACKER_PHRASES = [
  'NEURAL_CORE::ONLINE','BLOCKCHAIN::SYNCED','AI_MODEL::CALIBRATED',
  'SECURE_CHANNEL::OK','ORCHESTRATION::ACTIVE','QUANTUM_ENCRYPT::ON',
  'ISO_27001::COMPLIANT','ACCESS::GRANTED','THREAT_LEVEL::ZERO',
  '> INIT METAVERSE...','DOCKER MESH::7 NODES','HPC::7 MICROSERVICES',
  '01001111 01010010','01000011 01001000','TCP/IP::HANDSHAKE OK',
];
const SPAWN_COLORS = ['#f87171','#ef4444','#dc2626','#fca5a5'];
const buildScrambled = (t: string, p: number) =>
  t.split('').map((c,i) => c===' '?' ': p>=(i+1)/t.length ? c : Math.random()>.5 ? '1' : '0').join('');
const makeTextCanvas = (text: string, hex: string, a: number): HTMLCanvasElement => {
  const cv = document.createElement('canvas'); cv.width=1024; cv.height=72;
  const ctx = cv.getContext('2d')!; ctx.clearRect(0,0,1024,72);
  if(a<=0) return cv;
  const [r,g,b]=[1,3,5].map(off=>parseInt(hex.slice(off,off+2),16));
  ctx.font='bold 32px "Courier New",monospace'; ctx.textBaseline='middle';
  ctx.shadowColor=`rgba(${r},${g},${b},${a*.8})`; ctx.shadowBlur=18;
  ctx.fillStyle=`rgba(${r},${g},${b},${a})`; ctx.fillText(text,8,36); return cv;
};

const HackerNode = ({ position, phraseIndex, color }: { position:[number,number,number]; phraseIndex:number; color:string }) => {
  const groupRef=useRef<THREE.Group>(null); const meshRef=useRef<THREE.Mesh>(null);
  const tex=useRef<THREE.CanvasTexture|null>(null); const mat=useRef<THREE.MeshBasicMaterial|null>(null);
  const t=useRef(Math.random()*100); const timer=useRef(Math.random()*2);
  const phase=useRef<'wait'|'in'|'show'|'out'>('wait');
  const prog=useRef(0); const opac=useRef(0);
  const phrase=useRef(HACKER_PHRASES[phraseIndex%HACKER_PHRASES.length]);
  useEffect(()=>{
    const cv=makeTextCanvas('',color,0);
    const tx=new THREE.CanvasTexture(cv); tx.minFilter=THREE.LinearFilter;
    tex.current=tx;
    const m=new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
    mat.current=m;
    if(meshRef.current)(meshRef.current as any).material=m;
    return()=>{tx.dispose();m.dispose();};
  },[]);
  useEffect(()=>{if(meshRef.current&&mat.current)(meshRef.current as any).material=mat.current;});
  useFrame((_,delta)=>{
    if(!groupRef.current||!tex.current||!mat.current)return;
    t.current+=delta; timer.current+=delta;
    groupRef.current.position.y=position[1]+Math.sin(t.current*.4)*.4;
    const tg=phrase.current;
    if(phase.current==='wait'){if(timer.current>.8){phase.current='in';prog.current=0;timer.current=0;}}
    else if(phase.current==='in'){prog.current=Math.min(prog.current+delta*.68,1);opac.current=Math.min(opac.current+delta*3.5,.72);tex.current.image=makeTextCanvas(buildScrambled(tg,prog.current),color,opac.current);tex.current.needsUpdate=true;mat.current.opacity=opac.current;if(prog.current>=1){phase.current='show';timer.current=0;}}
    else if(phase.current==='show'){if(timer.current>3.5){phase.current='out';prog.current=1;timer.current=0;}}
    else if(phase.current==='out'){prog.current=Math.max(prog.current-delta*.65,0);opac.current=Math.max(opac.current-delta*2.2,0);tex.current.image=makeTextCanvas(buildScrambled(tg,prog.current),color,opac.current);tex.current.needsUpdate=true;mat.current.opacity=opac.current;if(opac.current<=0){phrase.current=HACKER_PHRASES[Math.floor(Math.random()*HACKER_PHRASES.length)];phase.current='wait';timer.current=0;}}
  });
  return(<group ref={groupRef} position={position}><mesh ref={meshRef} rotation={[0,Math.PI*.18,0]}><planeGeometry args={[5.5,.55]}/></mesh></group>);
};

const CLOUD_POSITIONS:[number,number,number][]=[[-9,3,-8],[-7,-2,-7],[8,4,-9],[6,-3,-7],[-5,5,-6],[-3,-5,-8],[4,6,-6],[2,1,-9],[-8,0,-5],[7,2,-5]];
const HackerCloud = () => {
  const [slots,setSlots]=useState<{pos:[number,number,number];idx:number;col:string;key:number}[]>([]);
  const keyRef=useRef(0);
  useEffect(()=>{
    const schedule=()=>setTimeout(()=>{
      setSlots(prev=>{
        if(prev.length>=3)return prev;
        const pos=CLOUD_POSITIONS[Math.floor(Math.random()*CLOUD_POSITIONS.length)];
        return[...prev,{pos,idx:Math.floor(Math.random()*HACKER_PHRASES.length),col:SPAWN_COLORS[Math.floor(Math.random()*4)],key:keyRef.current++}];
      });schedule();
    },1400+Math.random()*800);
    const tid={current:schedule()};
    const cl=setInterval(()=>setSlots(p=>p.length>1?p.slice(1):p),9000);
    return()=>{clearTimeout(tid.current);clearInterval(cl);};
  },[]);
  return<>{slots.map(s=><HackerNode key={s.key} position={s.pos} phraseIndex={s.idx} color={s.col}/>)}</>;
};

// ── Animated Counter ──────────────────────────────────────

const AnimCounter = ({ to, suffix='' }: { to:number; suffix?:string }) => {
  const [val,setVal]=useState(0);
  const ref=useRef<HTMLSpanElement>(null);
  const inView=useInView(ref,{once:true,margin:'-60px'});
  useEffect(()=>{
    if(!inView)return;
    let n=0; const step=Math.ceil(to/55);
    const t=setInterval(()=>{n=Math.min(n+step,to);setVal(n);if(n>=to)clearInterval(t);},28);
    return()=>clearInterval(t);
  },[inView,to]);
  return <span ref={ref}>{val}{suffix}</span>;
};

// ── 3D Tilt Card ──────────────────────────────────────────

const TiltCard = ({ children, style, intensity=10 }: {
  children:React.ReactNode; style?:React.CSSProperties; intensity?:number;
}) => {
  const ref=useRef<HTMLDivElement>(null);
  const [tilt,setTilt]=useState({x:0,y:0,gx:50,gy:50});
  const [hov,setHov]=useState(false);
  const onMove=useCallback((e:React.MouseEvent)=>{
    if(!ref.current)return;
    const r=ref.current.getBoundingClientRect();
    const dx=(e.clientX-r.left)/r.width-.5, dy=(e.clientY-r.top)/r.height-.5;
    setTilt({x:-dy*intensity,y:dx*intensity,gx:(dx+.5)*100,gy:(dy+.5)*100});
  },[intensity]);
  return (
    <div ref={ref} onMouseMove={onMove}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>{setHov(false);setTilt({x:0,y:0,gx:50,gy:50});}}
      style={{
        ...style, position:'relative', overflow:'hidden',
        transform:hov?`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px)`:'perspective(900px) rotateX(0) rotateY(0)',
        transition:hov?'transform .06s ease-out':'transform .5s ease',
        willChange:'transform',
      }}>
      {hov&&<div style={{position:'absolute',inset:0,borderRadius:'inherit',pointerEvents:'none',zIndex:1,background:`radial-gradient(140px at ${tilt.gx}% ${tilt.gy}%,rgba(239,68,68,.14),transparent)`,transition:'background .06s'}}/>}
      {children}
    </div>
  );
};

// ── Section Label ─────────────────────────────────────────

const SectionLabel = ({children}:{children:React.ReactNode}) => (
  <motion.p initial={{opacity:0,y:8}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.6}}
    style={{fontFamily:"'Courier New',monospace",fontSize:11,color:'#ef4444',letterSpacing:'0.35em',textTransform:'uppercase',
      marginBottom:14,display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
    <span style={{width:32,height:1,background:'linear-gradient(90deg,transparent,#ef4444)',display:'inline-block'}}/>
    {children}
    <span style={{width:32,height:1,background:'linear-gradient(90deg,#ef4444,transparent)',display:'inline-block'}}/>
  </motion.p>
);

// ── 3D Button ─────────────────────────────────────────────

const Btn3D = ({ onClick,children,primary=false,icon }: {
  onClick?:()=>void; children:React.ReactNode; primary?:boolean; icon?:React.ReactNode;
}) => {
  const [pressed,setPressed]=useState(false);
  const [hov,setHov]=useState(false);
  const depth=pressed?1:hov?6:4;
  const faceGrad=primary
    ?'linear-gradient(160deg,#ff6b6b 0%,#ef4444 40%,#b91c1c 100%)'
    :'linear-gradient(160deg,#2d0a0a 0%,#1a0505 60%,#0d0000 100%)';
  return (
    <motion.button onClick={onClick}
      onHoverStart={()=>setHov(true)} onHoverEnd={()=>setHov(false)}
      onTapStart={()=>setPressed(true)} onTap={()=>setPressed(false)} onTapCancel={()=>setPressed(false)}
      animate={{scale:pressed?.96:hov?1.05:1,rotateX:hov&&!pressed?-6:0,y:pressed?depth-1:0}}
      transition={{type:'spring',stiffness:380,damping:22}}
      style={{perspective:600,display:'inline-block',cursor:'pointer',position:'relative',border:'none',background:'none',pointerEvents:'auto'}}>
      <div style={{position:'absolute',bottom:-depth,left:4,right:4,height:depth,background:primary?'#7f1d1d':'#050000',borderRadius:'0 0 12px 12px',boxShadow:`0 ${depth+4}px ${depth*3}px ${primary?'#ef444488':'#ef444422'}`}}/>
      <div style={{position:'relative',padding:'15px 36px',borderRadius:12,fontFamily:"'Courier New',monospace",fontWeight:800,fontSize:13,letterSpacing:2,textTransform:'uppercase',color:primary?'#fff':'#f87171',background:faceGrad,border:`1px solid ${primary?'#ff6b6b':'#5a1a1a'}`,display:'flex',alignItems:'center',gap:10,minWidth:188,justifyContent:'center',overflow:'hidden'}}>
        <AnimatePresence>
          {hov&&<motion.div key="s" initial={{x:'-110%'}} animate={{x:'210%'}} exit={{opacity:0}} transition={{duration:.55}} style={{position:'absolute',top:0,bottom:0,left:0,width:'50%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)',pointerEvents:'none'}}/>}
        </AnimatePresence>
        {icon&&<span style={{fontSize:16}}>{icon}</span>}
        {children}
      </div>
    </motion.button>
  );
};

// ── Trailer Modal ─────────────────────────────────────────

const TrailerModal = ({onClose}:{onClose:()=>void}) => {
  const [err,setErr]=useState(false); const [loading,setLoading]=useState(true);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      style={{background:'rgba(0,0,0,.93)',backdropFilter:'blur(12px)'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:.88,y:40,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:.88,y:40,opacity:0}}
        transition={{type:'spring',stiffness:280,damping:28}}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{border:'1px solid rgba(239,68,68,.35)',background:'#060000',boxShadow:'0 0 80px rgba(239,68,68,.12)'}}>
        <div className="flex items-center justify-between px-8 py-5" style={{borderBottom:'1px solid rgba(239,68,68,.15)',background:'rgba(10,2,2,.9)'}}>
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"/>
            <span className="font-mono text-sm font-bold tracking-widest" style={{color:'#f87171'}}>AODS — TRAILER</span>
          </div>
          <motion.button onClick={onClose} whileHover={{scale:1.1,rotate:90}} whileTap={{scale:.9}}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{color:'#f87171',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)'}}>✕</motion.button>
        </div>
        <div style={{aspectRatio:'16/9',background:'#000',position:'relative'}}>
          {!err?(
            <>{loading&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{background:'#000'}}><div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/><span className="font-mono text-xs tracking-widest" style={{color:'#f87171'}}>LOADING...</span></div>}
            <video controls autoPlay className="w-full h-full" onError={()=>{setErr(true);setLoading(false);}} onCanPlay={()=>setLoading(false)} style={{display:loading?'none':'block',objectFit:'cover'}}><source src="/videos/trailer.mp4" type="video/mp4"/></video></>
          ):(
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{background:'radial-gradient(ellipse,#1a0505,#000)'}}>
              <motion.div animate={{opacity:[.5,1,.5]}} transition={{duration:2,repeat:Infinity}} className="font-mono text-xs tracking-widest mb-4" style={{color:'#ef4444'}}>//FILE NOT FOUND</motion.div>
              <h2 className="font-black tracking-tight mb-2" style={{fontSize:'clamp(32px,6vw,56px)',fontFamily:"'Courier New',monospace",background:'linear-gradient(135deg,#fca5a5,#ef4444,#dc2626)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>COMING SOON</h2>
              <p className="font-mono text-sm" style={{color:'rgba(252,165,165,.6)'}}>Trailer sedang dalam produksi</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Ticker ────────────────────────────────────────────────

const TICKER_ITEMS=['NEURAL CORE','BLOCKCHAIN','AI AGENT','METAVERSE','3D HOLOGRAPHIC','MICROSERVICES','SMART CONTRACTS','ISO 27001','ZERO TRUST','PLAY-TO-EARN','WEB4','POLYGLOT'];
const Ticker = () => (
  <div style={{overflow:'hidden',borderTop:'1px solid rgba(239,68,68,.12)',borderBottom:'1px solid rgba(239,68,68,.12)',padding:'10px 0',background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}}>
    <div style={{display:'flex',width:'max-content',animation:'lp-ticker 30s linear infinite'}}>
      {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>(
        <span key={i} style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'rgba(239,68,68,.45)',letterSpacing:4,textTransform:'uppercase',padding:'0 32px',display:'flex',alignItems:'center',gap:24,whiteSpace:'nowrap'}}>
          <span style={{width:4,height:4,borderRadius:'50%',background:'#ef444450',display:'inline-block',flexShrink:0}}/>
          {item}
        </span>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────

const HeroSection = ({ onTrailer, scrollY, lang='default' }: { onTrailer:()=>void; scrollY:number; lang?:LangKey }) => {
  const tl=T[lang as LangKey];
  const navigate=useNavigate();
  const [glitch,setGlitch]=useState(false);
  useEffect(()=>{const t=setInterval(()=>{setGlitch(true);setTimeout(()=>setGlitch(false),100);},4200);return()=>clearInterval(t);},[]);

  const parallaxY  = Math.min(scrollY * 0.3, 100);
  const opacity    = Math.max(1 - scrollY / 550, 0);
  const scale      = Math.max(1 - scrollY * 0.00025, 0.9);

  return (
    <section style={{position:'relative',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px',overflow:'hidden',pointerEvents:'none'}}>
      {/* Decorative rings */}
      {[320,460,580].map((sz,i)=>(
        <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:sz,height:sz,marginLeft:-sz/2,marginTop:-sz/2,borderRadius:'50%',border:`1px solid rgba(239,68,68,${.1-.025*i})`,animation:`${i%2===0?'lp-spin':'lp-rspin'} ${22+i*8}s linear infinite`,pointerEvents:'none'}}/>
      ))}
      {/* Scanline */}
      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        <div style={{position:'absolute',left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(239,68,68,.25),transparent)',animation:'lp-scanline 8s linear infinite'}}/>
      </div>

      <motion.div style={{transform:`translateY(${parallaxY}px) scale(${scale})`,opacity,pointerEvents:'auto',width:'100%',maxWidth:760,display:'flex',flexDirection:'column',alignItems:'center'}}>
        {/* Status badge */}
        <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 22px',borderRadius:999,marginBottom:28,background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.22)',backdropFilter:'blur(8px)'}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#ef4444',animation:'lp-pulse 1.4s ease-in-out infinite'}}/>
          <span style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'#fca5a5',letterSpacing:4}}>{tl.badge}</span>
        </motion.div>

        {/* AODS title with glitch */}
        <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.9}}>
          <h1 style={{
            fontFamily:"'Courier New',monospace",fontWeight:900,lineHeight:.88,
            fontSize:'clamp(80px,15vw,140px)',margin:'0 0 14px',letterSpacing:-3,
            background:'linear-gradient(160deg,#fff 0%,#fca5a5 35%,#ef4444 70%,#dc2626 100%)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
            filter:`drop-shadow(0 0 40px #ef444466)`,
            transform:glitch?'translateX(4px) skewX(-2deg)':'translateX(0) skewX(0)',
            transition:'transform .05s,filter .05s',
          }}>AODS</h1>
        </motion.div>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}}
          style={{fontFamily:"'Courier New',monospace",fontSize:'clamp(12px,1.7vw,16px)',color:'rgba(255,210,210,.7)',letterSpacing:'0.3em',marginBottom:8}}>
          {tl.tagline}
        </motion.p>

        <motion.p animate={{opacity:[.5,1,.5]}} transition={{duration:2.5,repeat:Infinity}}
          style={{fontFamily:"'Courier New',monospace",fontSize:'clamp(9px,1vw,11px)',color:'rgba(239,68,68,.55)',letterSpacing:'0.5em',marginBottom:44,textTransform:'uppercase'}}>
          ✦ The Holographic Enterprise Metaverse ✦
        </motion.p>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.45}}
          style={{color:'rgba(252,165,165,.5)',maxWidth:500,margin:'0 auto 48px',fontSize:'clamp(13px,1.3vw,16px)',lineHeight:1.85}}>
          {tl.sub}
        </motion.p>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.6}}
          style={{display:'flex',flexWrap:'wrap',gap:20,justifyContent:'center',alignItems:'center'}}>
          <Btn3D onClick={onTrailer} primary icon="▶">{tl.watchTrailer}</Btn3D>
          <Btn3D onClick={()=>navigate('/signup')} icon="◈">{tl.exploreUniverse}</Btn3D>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.6}}
        style={{position:'absolute',bottom:36,left:'50%',transform:'translateX(-50%)',pointerEvents:'none',opacity:Math.max(1-scrollY/180,0)}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
          <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(239,68,68,.35)',letterSpacing:'0.5em'}}>{tl.scroll}</span>
          <div style={{width:1,height:52,background:'linear-gradient(to bottom,#ef4444,transparent)',animation:'lp-pulse 1.8s ease-in-out infinite'}}/>
        </div>
      </motion.div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────────────────────

const STATS = [
  {value:9,   suffix:'',    label:'Languages',         sub:'Polyglot Architecture', icon:'⬡', color:'#f87171'},
  {value:8,   suffix:'',    label:'Microservices',      sub:'Docker Containers',     icon:'⊞', color:'#22d3ee'},
  {value:9,   suffix:'',    label:'Blockchain Modules', sub:'Smart Contracts',       icon:'◈', color:'#a78bfa'},
  {value:50,  suffix:'+',   label:'API Endpoints',      sub:'REST + WebSocket',      icon:'⊕', color:'#4ade80'},
  {value:12,  suffix:'K+',  label:'Lines of Code',      sub:'65+ Files',             icon:'◇', color:'#fbbf24'},
  {value:60,  suffix:' FPS',label:'3D Performance',     sub:'GPU Accelerated',       icon:'▷', color:'#fb923c'},
];

const StatsSection = () => (
  <section className="relative px-4 sm:px-6 py-28">
    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.82)',backdropFilter:'blur(16px)'}}/>
    {/* Subtle grid lines */}
    <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(239,68,68,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(239,68,68,.03) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}}/>
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <SectionLabel>System Metrics</SectionLabel>
        <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(24px,4vw,40px)',color:'#fff',margin:0}}>
          Platform <span style={{background:'linear-gradient(90deg,#f87171,#ef4444)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Statistics</span>
        </motion.h2>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:20}}>
        {STATS.map((s,i)=>(
          <motion.div key={i} initial={{opacity:0,y:32,scale:.94}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true,margin:'-40px'}} transition={{delay:i*.07,duration:.6,ease:[.22,1,.36,1]}}>
            <TiltCard style={{padding:'28px 22px',borderRadius:20,textAlign:'center',cursor:'default',background:`linear-gradient(135deg,rgba(18,3,3,.94),rgba(6,1,1,.97))`,border:`1px solid ${s.color}20`,backdropFilter:'blur(12px)',boxShadow:`0 4px 28px rgba(0,0,0,.5),0 0 40px ${s.color}06`}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${s.color}90,transparent)`,animation:'lp-beam 3.5s linear infinite',backgroundSize:'200% auto'}}/>
              {/* Icon circle */}
              <div style={{width:46,height:46,borderRadius:13,background:`${s.color}12`,border:`1px solid ${s.color}30`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:20,color:s.color,boxShadow:`0 0 20px ${s.color}18`}}>
                {s.icon}
              </div>
              <p style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(32px,4vw,52px)',margin:'0 0 8px',background:`linear-gradient(135deg,#fff 0%,${s.color} 100%)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1}}>
                <AnimCounter to={s.value} suffix={s.suffix}/>
              </p>
              <p style={{fontWeight:700,color:'rgba(255,255,255,.88)',fontSize:'clamp(11px,1.2vw,14px)',marginBottom:4}}>{s.label}</p>
              <p style={{fontSize:10,color:`${s.color}70`,fontFamily:"'Courier New',monospace",letterSpacing:1}}>{s.sub}</p>
              {/* Animated bottom bar */}
              <div style={{height:2,background:'rgba(255,255,255,.05)',borderRadius:1,marginTop:16,overflow:'hidden'}}>
                <motion.div initial={{width:0}} whileInView={{width:'100%'}} viewport={{once:true}} transition={{duration:1.4,delay:i*.1,ease:'easeOut'}}
                  style={{height:'100%',background:`linear-gradient(90deg,${s.color}40,${s.color})`,borderRadius:1}}/>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────
// INFRA SECTION — replaces LiveSystemStatus
// ─────────────────────────────────────────────────────────

const INFRA_NODES = [
  { name:'API Gateway',     lang:'Python',  port:'9000', status:'Online',  health:98, color:'#3b82f6' },
  { name:'Neural Core',     lang:'Python',  port:'9001', status:'Online',  health:95, color:'#a78bfa' },
  { name:'Go Telemetry',    lang:'Go',      port:'9002', status:'Online',  health:99, color:'#22d3ee' },
  { name:'C++ HPC',         lang:'C++',     port:'9003', status:'Online',  health:97, color:'#8b5cf6' },
  { name:'C# Enterprise',   lang:'C#',      port:'9004', status:'Standby', health:82, color:'#6366f1' },
  { name:'Java Bridge',     lang:'Java',    port:'9005', status:'Online',  health:91, color:'#f59e0b' },
  { name:'PHP Connector',   lang:'PHP',     port:'9006', status:'Online',  health:88, color:'#818cf8' },
  { name:'Ruby Automation', lang:'Ruby',    port:'9007', status:'Standby', health:74, color:'#ec4899' },
];

const InfraSection = () => {
  const [tick, setTick] = useState(0);
  useEffect(()=>{const id=setInterval(()=>setTick(v=>v+1),1000);return()=>clearInterval(id);},[]);
  return (
    <section className="relative px-4 sm:px-6 py-28">
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.75),rgba(12,2,2,.94))',backdropFilter:'blur(12px)'}}/>
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>Live Infrastructure</SectionLabel>
          <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(22px,4vw,38px)',color:'#fff',margin:'0 0 10px'}}>
            Real-Time <span style={{color:'#f87171'}}>Infrastructure</span>
          </motion.h2>
          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            style={{fontSize:13,color:'rgba(252,165,165,.38)',maxWidth:480,margin:'0 auto'}}>
            Monitor microservice health, compliance, dan system uptime secara real-time.
          </motion.p>
        </div>

        {/* KPI summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:28}}>
          {[
            {label:'System Uptime',  value:'99.7%',    color:'#22c55e', icon:'◉', sub:'30-day average'},
            {label:'Active Nodes',   value:'6 / 8',    color:'#3b82f6', icon:'⊞', sub:'Microservice Mesh'},
            {label:'Avg Latency',    value:'12ms',     color:'#a78bfa', icon:'⚡', sub:'P95 response time'},
            {label:'Compliance',     value:'ISO 27001', color:'#fb923c', icon:'✓', sub:'COBIT framework'},
          ].map((card,i)=>(
            <motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.07}}
              whileHover={{y:-4,scale:1.02}}
              style={{padding:'18px 20px',borderRadius:16,background:'rgba(12,2,2,.88)',border:`1px solid ${card.color}22`,backdropFilter:'blur(8px)',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${card.color}80,transparent)`}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <p style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(252,165,165,.38)',letterSpacing:2,marginBottom:6,textTransform:'uppercase'}}>{card.label}</p>
                  <p style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:22,color:card.color,textShadow:`0 0 12px ${card.color}66`,margin:0}}>{card.value}</p>
                </div>
                <span style={{fontSize:22,color:`${card.color}44`}}>{card.icon}</span>
              </div>
              <p style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(252,165,165,.22)',marginTop:8}}>{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Microservice node grid */}
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{background:'rgba(8,1,1,.85)',border:'1px solid rgba(239,68,68,.1)',borderRadius:20,padding:28}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:8}}>
            <p style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'#ef4444aa',letterSpacing:3,margin:0,textTransform:'uppercase'}}>
              Microservice Mesh — {INFRA_NODES.length} Nodes
            </p>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e',display:'inline-block',animation:'lp-pulse 2s ease-in-out infinite'}}/>
              <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(252,165,165,.4)',letterSpacing:2}}>LIVE · {tick}s</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:12}}>
            {INFRA_NODES.map((node,i)=>(
              <motion.div key={i} initial={{opacity:0,scale:.9}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:i*.04}}
                whileHover={{scale:1.04}}
                style={{padding:'14px',borderRadius:12,background:'rgba(4,0,0,.9)',border:`1px solid ${node.color}22`,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${node.color}50,transparent)`}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontFamily:"'Courier New',monospace",fontSize:11,fontWeight:700,color:'rgba(255,255,255,.85)'}}>{node.name.split(' ')[0]}</span>
                  <span style={{width:7,height:7,borderRadius:'50%',background:node.status==='Online'?'#22c55e':'#f59e0b',boxShadow:node.status==='Online'?'0 0 6px #22c55e':'0 0 6px #f59e0b',display:'inline-block'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:node.color,letterSpacing:1}}>{node.lang}</span>
                  <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(252,165,165,.4)'}}>:{node.port}</span>
                </div>
                <div style={{height:3,background:'rgba(255,255,255,.06)',borderRadius:2,overflow:'hidden'}}>
                  <motion.div initial={{width:0}} whileInView={{width:`${node.health}%`}} viewport={{once:true}} transition={{duration:1,delay:i*.05}}
                    style={{height:'100%',background:`linear-gradient(90deg,${node.color}50,${node.color})`,borderRadius:2}}/>
                </div>
                <p style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(252,165,165,.25)',marginTop:4,textAlign:'right'}}>{node.health}%</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// TECH STACK
// ─────────────────────────────────────────────────────────

const TECH_STACK = [
  {name:'React + TypeScript', role:'Frontend Framework',        color:'#61DAFB', port:null},
  {name:'Python FastAPI',      role:'API Gateway',               color:'#3776AB', port:9000},
  {name:'Python AI/ML',        role:'Neural Core',               color:'#FFD43B', port:9001},
  {name:'Go Telemetry',        role:'High-Performance Monitor',  color:'#00ADD8', port:9002},
  {name:'C++ HPC',             role:'Physics & Compute',         color:'#00589C', port:9003},
  {name:'C# Enterprise',       role:'SAP/Salesforce Bridge',     color:'#512BD4', port:9004},
  {name:'Java Bridge',         role:'Legacy Connectivity',       color:'#E76F00', port:9005},
  {name:'PHP Connector',       role:'Third-Party APIs',          color:'#777BB4', port:9006},
  {name:'Ruby Automation',     role:'Task Scheduling',           color:'#CC342D', port:9007},
];

const TechStackSection = () => (
  <section className="relative px-4 sm:px-6 py-24">
    <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.65),rgba(10,1,1,.93))',backdropFilter:'blur(10px)'}}/>
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Polyglot Architecture</SectionLabel>
        <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(22px,3.5vw,38px)',color:'#fff',margin:0}}>
          9 <span style={{color:'#f87171'}}>Languages</span>, 1 Ecosystem
        </motion.h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TECH_STACK.map((t,i)=>(
          <motion.div key={i} initial={{opacity:0,x:i%2===0?-20:20}} whileInView={{opacity:1,x:0}} viewport={{once:true,margin:'-20px'}} transition={{delay:i*.045}}>
            <TiltCard intensity={8} style={{padding:'14px 18px',borderRadius:13,background:'rgba(10,2,2,.9)',border:`1px solid ${t.color}1e`,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:14,cursor:'default'}}>
              <div style={{position:'absolute',left:0,top:8,bottom:8,width:3,background:`linear-gradient(to bottom,${t.color},${t.color}44)`,borderRadius:3,flexShrink:0}}/>
              <div style={{width:34,height:34,borderRadius:9,background:`${t.color}14`,border:`1px solid ${t.color}2a`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:6}}>
                <div style={{width:9,height:9,borderRadius:'50%',background:t.color,boxShadow:`0 0 10px ${t.color}`}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:700,color:'rgba(255,255,255,.9)',fontSize:13,marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.name}</p>
                <p style={{fontSize:11,color:'rgba(252,165,165,.45)',fontFamily:"'Courier New',monospace"}}>{t.role}</p>
              </div>
              {t.port&&<span style={{fontFamily:"'Courier New',monospace",fontSize:10,padding:'2px 7px',borderRadius:5,background:`${t.color}12`,color:t.color,border:`1px solid ${t.color}25`,flexShrink:0}}>:{t.port}</span>}
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────
// BLOCKCHAIN SECTION
// ─────────────────────────────────────────────────────────

const BC_MODULES = [
  {icon:'₿',  name:'Crypto & Payments', tech:'ERC-20',       status:'Live', col:'#f59e0b'},
  {icon:'📦', name:'Supply Chain',       tech:'Hyperledger',  status:'Live', col:'#22d3ee'},
  {icon:'🏥', name:'Healthcare',         tech:'ZK Proofs',    status:'Beta', col:'#a78bfa'},
  {icon:'🪪', name:'Digital Identity',   tech:'DID Protocol', status:'Live', col:'#34d399'},
  {icon:'🏢', name:'Asset Tokenization', tech:'ERC-1400',     status:'Live', col:'#fb923c'},
  {icon:'🚀', name:'ICO / IEO',          tech:'Escrow',       status:'Live', col:'#f87171'},
  {icon:'🎮', name:'Gaming & Esports',   tech:'Play-to-Earn', status:'Beta', col:'#c084fc'},
  {icon:'🗳️', name:'e-Voting',           tech:'DAO',          status:'Beta', col:'#60a5fa'},
  {icon:'🏦', name:'P2P Lending',        tech:'DeFi',         status:'Live', col:'#4ade80'},
];

const BlockchainSection = () => (
  <section className="relative px-4 sm:px-6 py-24">
    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.84)',backdropFilter:'blur(14px)'}}/>
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Web4 Blockchain Hub</SectionLabel>
        <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(22px,3.5vw,38px)',color:'#fff',margin:'0 0 6px'}}>
          9 Integrated <span style={{color:'#f87171'}}>Blockchain</span> Modules
        </motion.h2>
        <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
          style={{fontSize:11,color:'rgba(252,165,165,.4)',fontFamily:"'Courier New',monospace",letterSpacing:2}}>
          Smart Contracts · Solidity · Hyperledger Fabric · OpenZeppelin
        </motion.p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BC_MODULES.map((m,i)=>(
          <motion.div key={i} initial={{opacity:0,y:18,scale:.96}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true,margin:'-20px'}} transition={{delay:i*.04}}>
            <TiltCard intensity={10} style={{padding:'16px 18px',borderRadius:13,background:'rgba(7,1,1,.92)',border:`1px solid ${m.col}18`,cursor:'default'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${m.col}55,transparent)`}}/>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,borderRadius:11,background:`${m.col}12`,border:`1px solid ${m.col}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>{m.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:700,color:'rgba(255,255,255,.9)',fontSize:13,marginBottom:2}}>{m.name}</p>
                  <p style={{fontSize:10,color:'rgba(252,165,165,.45)',fontFamily:"'Courier New',monospace"}}>{m.tech}</p>
                </div>
                <span style={{fontSize:10,padding:'2px 9px',borderRadius:99,fontFamily:"'Courier New',monospace",fontWeight:700,flexShrink:0,background:m.status==='Live'?'rgba(34,197,94,.1)':'rgba(234,179,8,.1)',color:m.status==='Live'?'#86efac':'#fde047',border:`1px solid ${m.status==='Live'?'rgba(34,197,94,.28)':'rgba(234,179,8,.28)'}`}}>
                  {m.status==='Live'?'● Live':'◐ Beta'}
                </span>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────
// FEATURES SECTION
// ─────────────────────────────────────────────────────────

const FEATURES = [
  {icon:'🧠', title:'AI Neural Core',      color:'#a78bfa', desc:'LSTM predictions, Isolation Forest anomaly detection, BERT NLP, dan 1536-dim vector embeddings untuk orkestrasi cerdas.'},
  {icon:'🔗', title:'Blockchain Security', color:'#22d3ee', desc:'Protokol keamanan terdesentralisasi Web4 dengan identitas DID, ZK Proofs, dan enkripsi end-to-end.'},
  {icon:'🌐', title:'3D Holographic UI',   color:'#f87171', desc:'Antarmuka imersif berbasis Three.js + AFrame VR dengan visualisasi metaverse enterprise real-time.'},
  {icon:'⚡', title:'Multi-Language HPC',  color:'#fbbf24', desc:'8 microservice (Python, Go, C++, C#, Java, PHP, Ruby) dengan Docker orchestration performa tinggi.'},
  {icon:'🎮', title:'Gamification Layer',  color:'#4ade80', desc:'Sistem XP, level, achievement, dan tournament esports dengan Play-to-Earn AODS token rewards.'},
  {icon:'🛡️', title:'ISO 27001 / COBIT',  color:'#fb923c', desc:'Compliance otomatis, audit logging, Row-Level Security database, dan report governance real-time.'},
];

const FeaturesSection = () => (
  <section className="relative px-4 sm:px-6 py-24">
    <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.88),rgba(14,1,1,.96))',backdropFilter:'blur(10px)'}}/>
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Core Capabilities</SectionLabel>
        <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(22px,3.5vw,38px)',color:'#fff',margin:'0 0 6px'}}>
          Platform <span style={{color:'#f87171'}}>Next-Gen</span>
        </motion.h2>
        <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
          style={{fontSize:10,color:'rgba(252,165,165,.38)',fontFamily:"'Courier New',monospace",letterSpacing:'0.3em'}}>
          TEKNOLOGI TERDEPAN DALAM SATU EKOSISTEM HOLOGRAFIK
        </motion.p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f,i)=>(
          <motion.div key={i} initial={{opacity:0,y:32,scale:.94}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true,margin:'-40px'}} transition={{delay:i*.07,duration:.6,ease:[.22,1,.36,1]}}>
            <TiltCard intensity={13} style={{padding:'26px 22px',borderRadius:18,cursor:'default',background:'linear-gradient(135deg,rgba(18,3,3,.94),rgba(6,1,1,.97))',border:`1px solid ${f.color}1c`,boxShadow:`0 8px 32px rgba(0,0,0,.42),inset 0 1px 0 ${f.color}14`}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${f.color}75,transparent)`}}/>
              <div style={{width:50,height:50,borderRadius:13,background:`${f.color}10`,border:`1px solid ${f.color}24`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:14,boxShadow:`0 0 20px ${f.color}14`}}>{f.icon}</div>
              <h3 style={{fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:15,color:f.color,marginBottom:10}}>{f.title}</h3>
              <p style={{fontSize:13,lineHeight:1.78,color:'rgba(252,165,165,.52)'}}>{f.desc}</p>
              <div style={{position:'absolute',bottom:10,right:13,fontFamily:"'Courier New',monospace",fontSize:9,color:`${f.color}28`,letterSpacing:1}}>{String(i+1).padStart(2,'0')}</div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────
// CTA SECTION
// ─────────────────────────────────────────────────────────

const CTASection = ({ lang='default' }: { lang?: LangKey }) => {
  const navigate=useNavigate();
  const tl=T[lang as LangKey];
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
  const y=useTransform(scrollYProgress,[0,1],[36,-36]);
  const titleLines = tl.joinTitle.split('\n');
  return (
    <section ref={ref} className="relative px-4 overflow-hidden" style={{padding:'120px 24px'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 0%,rgba(139,28,28,.25) 0%,rgba(0,0,0,.97) 60%)'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(239,68,68,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(239,68,68,.04) 1px,transparent 1px)',backgroundSize:'48px 48px'}}/>
      {[300,440,560].map((sz,i)=>(
        <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:sz,height:sz,marginLeft:-sz/2,marginTop:-sz/2,borderRadius:'50%',border:`1px solid rgba(239,68,68,${.08-.02*i})`,animation:`${i%2===0?'lp-spin':'lp-rspin'} ${30+i*12}s linear infinite`,pointerEvents:'none'}}/>
      ))}
      {Array.from({length:6}).map((_,i)=>(
        <div key={i} style={{position:'absolute',width:4,height:4,borderRadius:'50%',background:'rgba(239,68,68,.3)',top:`${20+i*12}%`,left:`${10+i*15}%`,animation:`lp-float ${3+i*.5}s ease-in-out infinite`,animationDelay:`${i*.4}s`}}/>
      ))}
      <motion.div style={{y}} className="relative max-w-3xl mx-auto text-center">
        <motion.div initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
          <SectionLabel>{tl.sectionJoin}</SectionLabel>
          <h2 style={{fontFamily:"'Courier New',monospace",fontWeight:900,color:'#fff',fontSize:'clamp(28px,5.5vw,56px)',lineHeight:1.12,margin:'0 0 20px'}}>
            {titleLines[0]}<br/>
            <span className="lp-shimmer-text">{titleLines[1]}</span>
          </h2>
          <p style={{color:'rgba(252,165,165,.5)',fontSize:'clamp(13px,1.3vw,16px)',lineHeight:1.85,maxWidth:520,margin:'0 auto 48px'}}>
            {tl.joinSub}
          </p>
          <div style={{display:'flex',flexWrap:'wrap',gap:20,justifyContent:'center',marginBottom:48}}>
            <Btn3D onClick={()=>navigate('/signup')} primary icon="◈">{tl.createAccount}</Btn3D>
            <Btn3D onClick={()=>navigate('/login')} icon="→">{tl.signIn}</Btn3D>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center'}}>
            {tl.pills.map((pill,i)=>(
              <motion.span key={i} initial={{opacity:0,scale:.8}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:.08*i}}
                style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'rgba(252,165,165,.5)',padding:'5px 14px',borderRadius:99,background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.13)',letterSpacing:1}}>
                ✓ {pill}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────

const Footer = ({ lang='default' }: { lang?: LangKey }) => {
  const navigate = useNavigate();
  const tl = T[lang as LangKey];
  const isRTL = lang === 'ar';
  const productLinks = [
    { label: tl.footerLinks[0], path: '/#features' },
    { label: tl.footerLinks[1], path: '/#blockchain' },
    { label: tl.footerLinks[2], path: '/#ai' },
    { label: tl.footerLinks[3], path: '/docs' },
  ];
  const legalLinks = [
    { label: tl.footerLinks[4], path: '/privacy' },
    { label: tl.footerLinks[5], path: '/terms' },
  ];
  return (
    <footer style={{
      position:'relative',
      background:'linear-gradient(180deg,rgba(0,0,0,.95) 0%,#000 100%)',
      borderTop:'1px solid rgba(239,68,68,.12)',
      padding:'64px 24px 32px',
      direction: isRTL ? 'rtl' : 'ltr',
    }}>
      <style>{`.footer-grid{display:grid;grid-template-columns:1fr auto auto;gap:48px;margin-bottom:48px;}@media(max-width:640px){.footer-grid{grid-template-columns:1fr;}}`}</style>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(239,68,68,.04) 1px,transparent 1px)',backgroundSize:'24px 24px',pointerEvents:'none'}}/>
      <div style={{maxWidth:1200,margin:'0 auto',position:'relative'}}>
        <div className="footer-grid">
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#ef4444,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px #ef444440'}}>
                <span style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:14,color:'#fff'}}>A</span>
              </div>
              <span style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:18,color:'#fff',letterSpacing:-1}}>AODS</span>
            </div>
            <p style={{fontSize:13,color:'rgba(252,165,165,.42)',lineHeight:1.8,maxWidth:280}}>{tl.footerTagline}</p>
            <div style={{display:'flex',gap:12,marginTop:20}}>
              {['GH','TW','DC'].map(soc=>(
                <a key={soc} href="#"
                  style={{width:34,height:34,borderRadius:9,background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.15)',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',color:'rgba(252,165,165,.5)',fontFamily:"'Courier New',monospace",fontSize:11,fontWeight:700}}>
                  {soc}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'#ef4444',letterSpacing:3,marginBottom:16,textTransform:'uppercase'}}>Platform</p>
            {productLinks.map(link=>(
              <button key={link.label} onClick={()=>navigate(link.path)}
                style={{display:'block',fontFamily:"'Courier New',monospace",fontSize:12,color:'rgba(252,165,165,.5)',background:'none',border:'none',cursor:'pointer',padding:'5px 0',letterSpacing:1,textAlign:isRTL?'right':'left'}}
                onMouseEnter={e=>{(e.currentTarget).style.color='#f87171';}}
                onMouseLeave={e=>{(e.currentTarget).style.color='rgba(252,165,165,.5)';}}>
                {link.label}
              </button>
            ))}
          </div>
          <div>
            <p style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'#ef4444',letterSpacing:3,marginBottom:16,textTransform:'uppercase'}}>Legal</p>
            {legalLinks.map(link=>(
              <button key={link.label} onClick={()=>navigate(link.path)}
                style={{display:'block',fontFamily:"'Courier New',monospace",fontSize:12,color:'rgba(252,165,165,.5)',background:'none',border:'none',cursor:'pointer',padding:'5px 0',letterSpacing:1,textAlign:isRTL?'right':'left'}}
                onMouseEnter={e=>{(e.currentTarget).style.color='#f87171';}}
                onMouseLeave={e=>{(e.currentTarget).style.color='rgba(252,165,165,.5)';}}>
                {link.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(239,68,68,.2),transparent)',marginBottom:24}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
          <p style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'rgba(127,29,29,.6)',letterSpacing:1}}>{tl.footerCopyright}</p>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e',display:'inline-block',animation:'lp-pulse 2s ease-in-out infinite'}}/>
            <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(34,197,94,.5)',letterSpacing:2}}>ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ─────────────────────────────────────────────────────────
// LANGUAGE MODAL
// ─────────────────────────────────────────────────────────

const LanguageModal = ({ current, onSelect, onClose }: {
  current: LangKey; onSelect: (k: LangKey) => void; onClose: () => void;
}) => (
  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
    className="fixed inset-0 z-[300] flex items-center justify-center p-4"
    style={{background:'rgba(0,0,0,.88)',backdropFilter:'blur(12px)'}}
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <motion.div initial={{scale:.88,y:32,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:.88,y:32,opacity:0}}
      transition={{type:'spring',stiffness:300,damping:28}}
      style={{width:'100%',maxWidth:520,borderRadius:20,background:'linear-gradient(135deg,rgba(12,2,2,.98),rgba(4,0,0,1))',border:'1px solid rgba(239,68,68,.25)',boxShadow:'0 0 80px rgba(239,68,68,.1)',overflow:'hidden'}}>
      <div style={{padding:'20px 24px 16px',borderBottom:'1px solid rgba(239,68,68,.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <p style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'#ef4444',letterSpacing:3,textTransform:'uppercase',marginBottom:4}}>Language / Bahasa</p>
          <h3 style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:16,color:'#fff',margin:0}}>{T[current].langTitle}</h3>
        </div>
        <motion.button onClick={onClose} whileHover={{scale:1.1,rotate:90}} whileTap={{scale:.9}}
          style={{width:34,height:34,borderRadius:'50%',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',color:'#f87171',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✕</motion.button>
      </div>
      <div style={{padding:20,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,maxHeight:'70vh',overflowY:'auto'}}>
        {LANGUAGES.map(l=>(
          <motion.button key={l.key} onClick={()=>{onSelect(l.key);onClose();}}
            whileHover={{scale:1.04}} whileTap={{scale:.96}}
            style={{
              padding:'12px 8px',borderRadius:12,
              background:current===l.key?'rgba(239,68,68,.15)':'rgba(255,255,255,.03)',
              border:`1px solid ${current===l.key?'rgba(239,68,68,.5)':'rgba(255,255,255,.07)'}`,
              cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,
            }}>
            <span style={{fontSize:22}}>{l.flag}</span>
            <span style={{fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:11,color:current===l.key?'#f87171':'rgba(255,255,255,.75)',letterSpacing:.5}}>{l.native}</span>
            <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(252,165,165,.35)',letterSpacing:1}}>{l.label}</span>
            {current===l.key&&<div style={{width:20,height:2,background:'#ef4444',borderRadius:1}}/>}
          </motion.button>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showContent, setShowContent] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [lang, setLang] = useState<LangKey>('default');
  const [scrollY, setScrollY] = useState(0);

  useEffect(()=>{
    const onScroll=()=>setScrollY(window.scrollY);
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>window.removeEventListener('scroll',onScroll);
  },[]);

  return (
    <div style={{background:'radial-gradient(ellipse at 30% 20%,#1a0505 0%,#0a0000 55%,#000 100%)',overflowX:'hidden'}}>
      <style>{GLOBAL_CSS}</style>

      {/* Fixed 3D background */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}>
        <Canvas shadows dpr={[1,1.5]} camera={{position:[0,2,13],fov:60}}>
          <ambientLight intensity={0.2}/>
          <pointLight position={[10,10,10]} intensity={2} color="#ef4444"/>
          <pointLight position={[-10,-10,-10]} intensity={1} color="#f87171"/>
          <pointLight position={[0,-8,5]} intensity={0.5} color="#dc2626"/>
          <Stars radius={120} depth={60} count={5500} factor={5} saturation={0.2} fade speed={0.8}/>
          <NeuralOrb scrollY={scrollY}/>
          <HackerCloud/>
          <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
            <mesh position={[-7,2.5,-3]}>
              <octahedronGeometry args={[0.9,0]}/>
              <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} metalness={0.8} roughness={0.2}/>
            </mesh>
          </Float>
          <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1}>
            <mesh position={[7,-2,-2]}>
              <dodecahedronGeometry args={[0.8,0]}/>
              <meshStandardMaterial color="#f87171" metalness={0.9} roughness={0.1}/>
            </mesh>
          </Float>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3}/>
        </Canvas>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,.5) 100%)'}}/>
      </div>

      {/* Language toggle */}
      <motion.button whileHover={{scale:1.12}} whileTap={{scale:.88}} onClick={()=>setShowLang(v=>!v)}
        style={{position:'fixed',bottom:76,right:24,zIndex:50,width:44,height:44,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.82)',border:`1px solid ${showLang?'rgba(239,68,68,.55)':'rgba(100,20,20,.35)'}`,backdropFilter:'blur(8px)',cursor:'pointer'}}>
        <svg style={{width:18,height:18,color:showLang?'#f87171':'rgba(252,165,165,.5)'}} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.954 8.954 0 01.284-2.253"/>
        </svg>
      </motion.button>

      {/* Eye toggle */}
      <motion.button whileHover={{scale:1.12}} whileTap={{scale:.88}} onClick={()=>setShowContent(v=>!v)}
        style={{position:'fixed',bottom:24,right:24,zIndex:50,width:44,height:44,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.82)',border:`1px solid ${showContent?'rgba(239,68,68,.55)':'rgba(100,20,20,.35)'}`,backdropFilter:'blur(8px)',cursor:'pointer'}}>
        {showContent
          ?<svg style={{width:18,height:18,color:'#f87171'}} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          :<svg style={{width:18,height:18,color:'#555'}} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>}
      </motion.button>

      <AnimatePresence>{showTrailer&&<TrailerModal onClose={()=>setShowTrailer(false)}/>}</AnimatePresence>
      <AnimatePresence>{showLang&&<LanguageModal current={lang} onSelect={setLang} onClose={()=>setShowLang(false)}/>}</AnimatePresence>

      <AnimatePresence>
        {showContent&&(
          <motion.div key="content" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.5}} style={{position:'relative',zIndex:10}}>
            <HeroSection onTrailer={()=>setShowTrailer(true)} scrollY={scrollY} lang={lang}/>
            <Ticker/>
            <StatsSection/>
            <InfraSection/>
            <TechStackSection/>
            <BlockchainSection/>
            <FeaturesSection/>
            <CTASection lang={lang}/>
            <Footer lang={lang}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
