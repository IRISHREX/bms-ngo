import { motion } from "framer-motion";
import { Heart, Target, Award, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div>
      {/* Header */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-4">About HopeFoundation</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">Building brighter futures for rural India through education, healthcare, and community empowerment since 2021.</p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="admin-card space-y-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To provide free, quality education and essential services to underserved rural communities, 
              empowering individuals to break the cycle of poverty and build self-sustaining futures.
            </p>
          </div>
          <div className="admin-card space-y-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              A world where every child has access to education, healthcare, and opportunities regardless 
              of their geographical or socioeconomic background. We envision thriving rural communities 
              that are self-empowered and resilient.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Message */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">F</span>
            </div>
            <h2 className="text-2xl font-bold">Founder's Message</h2>
            <blockquote className="text-lg text-muted-foreground italic leading-relaxed">
              "When I visited the remote villages of West Bengal in 2020, I saw children walking miles just to find a school. 
              That moment changed everything for me. HopeFoundation was born from a simple belief — that education is not a 
              privilege, but a right. Every child we reach is a life transformed."
            </blockquote>
            <p className="font-semibold">— Founder, HopeFoundation</p>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-12">Our Journey</h2>
          <div className="space-y-8">
            {[
              { year: "2021", title: "Foundation Established", desc: "Registered as an NGO in West Bengal with a team of 5 volunteers." },
              { year: "2022", title: "First Education Center", desc: "Opened our first free learning center serving 120 students in rural West Bengal." },
              { year: "2023", title: "Expanding Reach", desc: "Launched medical camps and food distribution programs across 15 villages." },
              { year: "2024", title: "Women Empowerment", desc: "Started skill development programs for rural women in Bihar and West Bengal." },
              { year: "2025", title: "Growing Impact", desc: "3,200+ students helped, 45+ villages reached, and counting." },
            ].map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{item.year.slice(2)}</div>
                  {i < 4 && <div className="w-0.5 h-full bg-border mt-2" />}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold">{item.year} — {item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration & Documents */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Registration & Certificates</h2>
            <p className="text-muted-foreground">Full transparency — all our legal documents are publicly available</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { title: "NGO Registration", desc: "Registration No: XXXXX/2021", icon: Award },
              { title: "80G Certificate", desc: "Tax exemption for donors under Section 80G", icon: FileText },
              { title: "12A Registration", desc: "Income tax exemption certificate", icon: FileText },
            ].map((doc) => (
              <div key={doc.title} className="admin-card text-center space-y-3">
                <doc.icon className="w-8 h-8 text-primary mx-auto" />
                <h3 className="font-semibold text-sm">{doc.title}</h3>
                <p className="text-xs text-muted-foreground">{doc.desc}</p>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-3 h-3" /> Download PDF
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
