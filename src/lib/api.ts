// API Service Layer
// Replace BASE_URL with your actual backend URL
const BASE_URL = "/api";

// ============ TYPES ============

export interface DashboardStats {
  totalDonations: number;
  totalVolunteers: number;
  totalPhotos: number;
  totalNotices: number;
  totalBlogPosts: number;
  totalProjects: number;
  donationAmount: number;
  studentsHelped: number;
  mealsServed: number;
  villagesReached: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  folder: string;
  uploadedBy: string;
  uploadedAt: string;
  usedIn: string;
  url: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  category: "events" | "beneficiaries" | "volunteers" | "field-visits";
  uploadedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  publishDate: string;
  expiryDate?: string;
  pinned: boolean;
  status: "active" | "expired" | "draft";
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  status: "draft" | "published";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  fundsUsed: number;
  status: "ongoing" | "completed" | "planned";
  photos: string[];
  createdAt: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  type: "volunteer" | "partner" | "intern";
  status: "new" | "contacted" | "approved" | "rejected";
  createdAt: string;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  paymentId: string;
  receiptGenerated: boolean;
  type: "one-time" | "monthly" | "campaign";
  campaign?: string;
}

// ============ MOCK DATA ============

const mockStats: DashboardStats = {
  totalDonations: 1247,
  totalVolunteers: 89,
  totalPhotos: 248,
  totalNotices: 35,
  totalBlogPosts: 42,
  totalProjects: 12,
  donationAmount: 2450000,
  studentsHelped: 3200,
  mealsServed: 15000,
  villagesReached: 45,
};

const mockFiles: FileItem[] = [
  { id: "1", name: "annual-report-2024.pdf", type: "pdf", size: 2400000, folder: "reports", uploadedBy: "Admin", uploadedAt: "2024-12-15", usedIn: "Financial Transparency", url: "#" },
  { id: "2", name: "camp-photo-01.jpg", type: "image", size: 540000, folder: "gallery", uploadedBy: "Field Team", uploadedAt: "2024-11-20", usedIn: "Gallery", url: "#" },
  { id: "3", name: "80g-certificate.pdf", type: "pdf", size: 180000, folder: "certificates", uploadedBy: "Admin", uploadedAt: "2024-01-10", usedIn: "About Us", url: "#" },
  { id: "4", name: "volunteer-drive-poster.png", type: "image", size: 320000, folder: "notices", uploadedBy: "Content Team", uploadedAt: "2025-01-05", usedIn: "Notices", url: "#" },
  { id: "5", name: "education-program-report.pdf", type: "pdf", size: 1800000, folder: "reports", uploadedBy: "Admin", uploadedAt: "2024-09-30", usedIn: "Projects", url: "#" },
];

const mockNotices: Notice[] = [
  { id: "1", title: "Volunteer Drive - February 2025", description: "Join us for our monthly volunteer drive in rural West Bengal.", publishDate: "2025-02-01", expiryDate: "2025-02-28", pinned: true, status: "active" },
  { id: "2", title: "Scholarship Applications Open", description: "Apply for the 2025 education scholarship program for underprivileged students.", publishDate: "2025-01-15", expiryDate: "2025-03-15", pinned: false, status: "active" },
  { id: "3", title: "Medical Camp in Sundarbans", description: "Free medical checkup camp on March 5th, 2025.", publishDate: "2025-02-10", pinned: true, status: "active" },
];

const mockBlogPosts: BlogPost[] = [
  { id: "1", title: "Meet Raju: First Graduate in His Village", content: "An inspiring story...", coverImage: "#", status: "published", tags: ["education", "success-story"], createdAt: "2025-01-20", updatedAt: "2025-01-20" },
  { id: "2", title: "Medical Camp in West Bengal Report", content: "Our latest medical camp served...", coverImage: "#", status: "published", tags: ["health", "report"], createdAt: "2025-01-10", updatedAt: "2025-01-12" },
  { id: "3", title: "How ₹500 Changed a Life", content: "A small donation, big impact...", status: "draft", tags: ["donation", "impact"], createdAt: "2025-02-01", updatedAt: "2025-02-01" },
];

const mockProjects: Project[] = [
  { id: "1", title: "Rural Education Initiative", description: "Providing free education to 500+ students in 15 villages", location: "West Bengal", budget: 500000, fundsUsed: 380000, status: "ongoing", photos: [], createdAt: "2023-06-01" },
  { id: "2", title: "Medical Camp Series", description: "Monthly medical camps in underserved areas", location: "Sundarbans", budget: 200000, fundsUsed: 200000, status: "completed", photos: [], createdAt: "2024-01-01" },
  { id: "3", title: "Women Empowerment Program", description: "Skill development and micro-finance for rural women", location: "Bihar", budget: 350000, fundsUsed: 120000, status: "ongoing", photos: [], createdAt: "2024-06-01" },
];

const mockVolunteers: Volunteer[] = [
  { id: "1", name: "Priya Sharma", phone: "+91-9876543210", email: "priya@email.com", message: "I want to teach rural students", type: "volunteer", status: "approved", createdAt: "2025-01-15" },
  { id: "2", name: "TechCorp India", phone: "+91-1122334455", email: "csr@techcorp.com", message: "CSR partnership inquiry", type: "partner", status: "new", createdAt: "2025-02-10" },
  { id: "3", name: "Ankit Verma", phone: "+91-9988776655", email: "ankit@college.edu", message: "Looking for summer internship", type: "intern", status: "contacted", createdAt: "2025-02-05" },
];

const mockDonations: Donation[] = [
  { id: "1", donorName: "Rajesh Kumar", amount: 5000, date: "2025-02-15", paymentId: "pay_ABC123", receiptGenerated: true, type: "one-time" },
  { id: "2", donorName: "Sunita Devi", amount: 1000, date: "2025-02-14", paymentId: "pay_DEF456", receiptGenerated: true, type: "monthly" },
  { id: "3", donorName: "Anonymous", amount: 25000, date: "2025-02-10", paymentId: "pay_GHI789", receiptGenerated: false, type: "campaign", campaign: "School Building Fund" },
  { id: "4", donorName: "Meera Patel", amount: 2000, date: "2025-02-08", paymentId: "pay_JKL012", receiptGenerated: true, type: "one-time" },
];

// ============ API FUNCTIONS ============
// Replace these with actual fetch calls to your backend

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await delay(300);
  // return fetch(`${BASE_URL}/stats`).then(r => r.json());
  return mockStats;
}

export async function fetchFiles(): Promise<FileItem[]> {
  await delay(300);
  return mockFiles;
}

export async function fetchNotices(): Promise<Notice[]> {
  await delay(200);
  return mockNotices;
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  await delay(200);
  return mockBlogPosts;
}

export async function fetchProjects(): Promise<Project[]> {
  await delay(200);
  return mockProjects;
}

export async function fetchVolunteers(): Promise<Volunteer[]> {
  await delay(200);
  return mockVolunteers;
}

export async function fetchDonations(): Promise<Donation[]> {
  await delay(200);
  return mockDonations;
}

// ============ HELPERS ============

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
