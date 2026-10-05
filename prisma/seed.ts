import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial ARC 11 Architect data...');

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'arc11-architect' },
    update: {},
    create: {
      name: 'ARC 11 Architect',
      slug: 'arc11-architect',
      businessCategory: 'Architecture & Interior Design Consultancy',
      status: 'active',
    },
  });

  console.log(`✓ Organization: ${org.name} (${org.id})`);

  // 2. Super Admin User
  const passwordHash = await bcrypt.hash('Arc11Admin2026!', 10);
  const admin = await prisma.teamMember.upsert({
    where: { email: 'admin@arc11architect.com' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'ARC 11 Lead Architect',
      email: 'admin@arc11architect.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      phone: '+919999999999',
    },
  });

  console.log(`✓ Super Admin: ${admin.email}`);

  // 3. Official Services
  const servicesData = [
    {
      title: 'Architecture & Planning',
      category: 'Architecture',
      description: 'Comprehensive architectural master planning, conceptual design, municipal sanction drawings, and detailed construction documentation for residential and commercial structures.',
      keyFeatures: ['Site Analysis & Feasibility', 'Conceptual 2D Floor Plans', 'Structural & MEP Coordination', 'Working Drawings'],
      sortOrder: 1,
    },
    {
      title: 'Interior Design',
      category: 'Interior',
      description: 'Bespoke interior concepts, spatial planning, material palettes, lighting schemes, custom joinery, and turnkey design consultation.',
      keyFeatures: ['Space Optimization', 'Custom Furniture & Joinery', 'Lighting & False Ceiling Design', 'Material Selection & Finish Schedules'],
      sortOrder: 2,
    },
    {
      title: '3D Visualization',
      category: '3D Visualization',
      description: 'Photorealistic architectural 3D exterior elevations, interior walkthroughs, and daytime/nighttime lighting simulations.',
      keyFeatures: ['Photorealistic 3D Renders', 'High-Res Exterior Views', 'Interior Walkthrough Animations', 'Virtual Reality Previews'],
      sortOrder: 3,
    },
    {
      title: 'Residential Projects',
      category: 'Residential',
      description: 'Tailored residential architectural designs from modern luxury villas, duplex homes, independent bungalows to multi-family apartments.',
      keyFeatures: ['Custom Villa Architecture', 'Bungalow & Farmhouse Design', 'Duplex Living Optimization', 'Vastu / Climate-Responsive Layouts'],
      sortOrder: 4,
    },
    {
      title: 'Commercial Projects',
      category: 'Commercial',
      description: 'High-efficiency corporate offices, retail showrooms, boutique hotels, and mixed-use commercial space planning.',
      keyFeatures: ['Corporate Office Fitouts', 'Retail & Boutique Showrooms', 'Hospitality & Cafe Interiors', 'Code Compliance & Fire Safety'],
      sortOrder: 5,
    },
    {
      title: 'Renovation & Remodeling',
      category: 'Renovation',
      description: 'Structural retrofitting, façade revamps, modern layout transformation, and heritage revival for existing spaces.',
      keyFeatures: ['Façade Modernization', 'Layout Reconfiguration', 'Structural Assessment', 'Value-Engineered Remodeling'],
      sortOrder: 6,
    },
  ];

  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({
      where: { organizationId: org.id, title: s.title },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          organizationId: org.id,
          ...s,
        },
      });
    }
  }

  console.log(`✓ Seeded ${servicesData.length} Architectural Services`);

  // 4. Approved ARC 11 FAQs
  const faqsData = [
    {
      question: 'What architectural services does ARC 11 Architect provide?',
      answer: 'ARC 11 Architect specializes in complete Architectural Master Planning, Residential & Commercial Building Design, Luxury Interior Design, 3D Photorealistic Visualization, and Structural Renovation consultancy.',
      category: 'services',
      keywords: ['services', 'architecture', 'interior', 'scope'],
      priority: 1,
    },
    {
      question: 'How do we start a new project with ARC 11 Architect?',
      answer: 'Starting is straightforward: share your site/plot location, plot dimensions, number of planned floors, and initial spatial requirements. Our team will review the details and schedule an initial concept consultation.',
      category: 'process',
      keywords: ['start', 'process', 'new project', 'requirements'],
      priority: 1,
    },
    {
      question: 'Do you provide 3D elevations and walkthroughs?',
      answer: 'Yes, we develop high-fidelity 3D exterior elevations, daytime/dusk lighting views, and 3D interior walkthroughs so you experience your space before physical construction begins.',
      category: 'services',
      keywords: ['3d', 'elevation', 'walkthrough', 'render'],
      priority: 2,
    },
    {
      question: 'Can I speak directly with an architect or team member?',
      answer: 'Certainly. You can request a phone call or office consultation anytime by sending "Human" or "Talk to team", and an ARC 11 Architect representative will connect with you.',
      category: 'contact',
      keywords: ['human', 'team', 'call', 'talk', 'architect'],
      priority: 1,
    },
  ];

  for (const f of faqsData) {
    const existing = await prisma.faq.findFirst({
      where: { organizationId: org.id, question: f.question },
    });
    if (!existing) {
      await prisma.faq.create({
        data: {
          organizationId: org.id,
          ...f,
        },
      });
    }
  }

  console.log(`✓ Seeded ${faqsData.length} ARC 11 FAQs`);

  // 5. System Settings (Welcome Menu and Messages)
  const defaultWelcomeMenu = {
    greetingText: 'Welcome to ARC 11 Architect.\n\nWe provide professional architectural and design solutions for residential, commercial and bespoke projects.\n\nHow can we help you today?\n\n1. Architecture & Planning\n2. Interior Design\n3. 3D Visualization\n4. Residential Projects\n5. Commercial Projects\n6. Renovation & Remodeling\n7. Start a New Project\n8. Book a Consultation\n9. Portfolio\n10. Talk to Our Team',
    leadPrompt: 'Glad to assist you with your project! To help our architects understand your requirements, please share:\n\n1. Project Location (City/Area)\n2. Plot / Site Size\n3. Number of Floors\n4. Primary requirements (e.g. 4BHK Villa, Office)',
    humanHandoffText: 'You have been connected to our human support queue. An ARC 11 Architect representative has been notified and will assist you shortly.',
    fallbackText: 'Thank you for contacting ARC 11 Architect. We have noted your message and our team will get back to you shortly. You can also reply "Menu" to see all options or "Team" to speak to an architect.',
  };

  await prisma.systemSetting.upsert({
    where: { key: 'bot_responses' },
    update: { value: defaultWelcomeMenu },
    create: {
      organizationId: org.id,
      key: 'bot_responses',
      value: defaultWelcomeMenu,
      description: 'Default automated WhatsApp messages and menu structure',
    },
  });

  console.log('✓ Seeded System Settings');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
