// API Service Layer — wired to Express backend
import { authHeaders, authHeadersMultipart } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

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

// ============ GENERIC HELPERS ============

async function get<T>(url: string, authenticated = false): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: authenticated ? authHeaders() : { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post<T>(url: string, body: unknown, authenticated = true): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: "POST",
    headers: authenticated ? authHeaders() : { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function put<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function del<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ============ DASHBOARD ============

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return get<DashboardStats>("/stats");
}

export async function updateImpactStats(data: { studentsHelped: number; mealsServed: number; villagesReached: number }) {
  return put("/stats/impact", data);
}

// ============ FILES ============

export async function fetchFiles(): Promise<FileItem[]> {
  return get<FileItem[]>("/files", true);
}

export async function uploadFile(file: File, folder: string, usedIn: string): Promise<FileItem> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  form.append("usedIn", usedIn);
  const res = await fetch(`${BASE_URL}/files/upload`, {
    method: "POST",
    headers: authHeadersMultipart(),
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function deleteFile(id: string) {
  return del(`/files/${id}`);
}

// ============ GALLERY ============

export async function fetchGallery(): Promise<GalleryItem[]> {
  return get<GalleryItem[]>("/gallery");
}

export async function uploadGalleryPhotos(files: File[], category: string, caption: string): Promise<GalleryItem[]> {
  const form = new FormData();
  files.forEach((f) => form.append("photos", f));
  form.append("category", category);
  form.append("caption", caption);
  const res = await fetch(`${BASE_URL}/gallery`, {
    method: "POST",
    headers: authHeadersMultipart(),
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function updateGalleryItem(id: string, data: { caption: string; category: string }) {
  return put(`/gallery/${id}`, data);
}

export async function deleteGalleryItem(id: string) {
  return del(`/gallery/${id}`);
}

// ============ NOTICES ============

export async function fetchNotices(): Promise<Notice[]> {
  return get<Notice[]>("/notices");
}

export async function fetchAdminNotices(): Promise<Notice[]> {
  return get<Notice[]>("/notices/admin", true);
}

export async function createNotice(data: Partial<Notice>) {
  return post("/notices", data);
}

export async function updateNotice(id: string, data: Partial<Notice>) {
  return put(`/notices/${id}`, data);
}

export async function deleteNotice(id: string) {
  return del(`/notices/${id}`);
}

// ============ BLOG ============

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  return get<BlogPost[]>("/blog");
}

export async function fetchAdminBlogPosts(): Promise<BlogPost[]> {
  return get<BlogPost[]>("/blog/admin", true);
}

export async function createBlogPost(data: Partial<BlogPost>) {
  return post("/blog", data);
}

export async function updateBlogPost(id: string, data: Partial<BlogPost>) {
  return put(`/blog/${id}`, data);
}

export async function deleteBlogPost(id: string) {
  return del(`/blog/${id}`);
}

// ============ PROJECTS ============

export async function fetchProjects(): Promise<Project[]> {
  return get<Project[]>("/projects");
}

export async function createProject(data: Partial<Project>) {
  return post("/projects", data);
}

export async function updateProject(id: string, data: Partial<Project>) {
  return put(`/projects/${id}`, data);
}

export async function deleteProject(id: string) {
  return del(`/projects/${id}`);
}

// ============ VOLUNTEERS ============

export async function fetchVolunteers(): Promise<Volunteer[]> {
  return get<Volunteer[]>("/volunteers", true);
}

export async function submitVolunteerForm(data: Partial<Volunteer>) {
  return post("/volunteers", data, false);
}

export async function updateVolunteerStatus(id: string, status: string) {
  return put(`/volunteers/${id}`, { status });
}

// ============ DONATIONS ============

export async function fetchDonations(): Promise<Donation[]> {
  return get<Donation[]>("/donations", true);
}

export async function createDonation(data: Partial<Donation>) {
  return post("/donations", data, false);
}

export async function generateReceipt(id: string) {
  return post(`/donations/${id}/receipt`, {});
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
