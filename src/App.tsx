import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public
import PublicLayout from "@/components/PublicLayout";
import HomePage from "@/pages/public/HomePage";
import AboutPage from "@/pages/public/AboutPage";
import ImpactPage from "@/pages/public/ImpactPage";
import ProgramsPage from "@/pages/public/ProgramsPage";
import GalleryPage from "@/pages/public/GalleryPage";
import BlogPage from "@/pages/public/BlogPage";
import NoticesPage from "@/pages/public/NoticesPage";
import TransparencyPage from "@/pages/public/TransparencyPage";
import DonatePage from "@/pages/public/DonatePage";
import VolunteerPage from "@/pages/public/VolunteerPage";

// Admin
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import FileManager from "@/pages/admin/FileManager";
import GalleryManager from "@/pages/admin/GalleryManager";
import NoticeManager from "@/pages/admin/NoticeManager";
import BlogManager from "@/pages/admin/BlogManager";
import ProjectsManager from "@/pages/admin/ProjectsManager";
import VolunteerManager from "@/pages/admin/VolunteerManager";
import DonationManager from "@/pages/admin/DonationManager";
import UsersRoles from "@/pages/admin/UsersRoles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/transparency" element={<TransparencyPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/volunteer" element={<VolunteerPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="files" element={<FileManager />} />
            <Route path="gallery" element={<GalleryManager />} />
            <Route path="notices" element={<NoticeManager />} />
            <Route path="blog" element={<BlogManager />} />
            <Route path="projects" element={<ProjectsManager />} />
            <Route path="volunteers" element={<VolunteerManager />} />
            <Route path="donations" element={<DonationManager />} />
            <Route path="users" element={<UsersRoles />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
