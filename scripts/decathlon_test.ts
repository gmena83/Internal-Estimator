/**
 * ISI v2.0 Decathlon Stress Test
 * Runs 10 distinct scenarios through the 5-stage workflow
 */

const API_BASE = 'http://localhost:5000/api';

interface TestScenario {
    name: string;
    rawInput: string;
    expectedKeywords: string[];
}

const scenarios: TestScenario[] = [
    {
        name: "Fintech MVP",
        rawInput: `Client: FinPay Solutions (LatAm Startup)
Mission: Build a high-security payment gateway for the Latin American market
Requirements:
- PCI-DSS Level 1 compliance
- Multi-currency support (USD, BRL, ARS, MXN)
- Real-time fraud detection with ML
- Integration with Mercado Pago, PIX, SPEI
Budget: $150,000-250,000
Timeline: 6 months`,
        expectedKeywords: ["PCI-DSS", "compliance", "fraud detection", "payment"]
    },
    {
        name: "No-Code Pivot",
        rawInput: `Client: StyleHaven E-commerce
Mission: Migrate from Shopify Plus to custom headless commerce stack
Requirements:
- Keep existing 50,000 product catalog
- Improve page load speed to under 1 second
- Custom checkout flow with upsells
- Integration with existing ERP (SAP)
Budget: $80,000-120,000
Timeline: 4 months`,
        expectedKeywords: ["migration", "headless", "Shopify", "e-commerce"]
    },
    {
        name: "Enterprise RAG",
        rawInput: `Client: Morrison & Partners LLP (Global Law Firm)
Mission: Private Knowledge Base with RAG for legal document search
Requirements:
- On-premise deployment (no cloud)
- Support for 2M+ documents
- Multi-language (EN, ES, FR, DE)
- Semantic search with citation extraction
- Audit logging for compliance
Budget: $300,000-500,000
Timeline: 8 months`,
        expectedKeywords: ["RAG", "knowledge base", "legal", "semantic search"]
    },
    {
        name: "IoT Integration",
        rawInput: `Client: SmartCity Solutions
Mission: Smart parking management system with IoT sensors
Requirements:
- 10,000 parking spot sensors
- Real-time availability dashboard
- Mobile app for drivers
- Integration with city payment systems
- Edge computing for low latency
Budget: $400,000-600,000
Timeline: 12 months`,
        expectedKeywords: ["IoT", "sensors", "real-time", "edge computing"]
    },
    {
        name: "Healthcare SaaS",
        rawInput: `Client: MedCare Digital
Mission: HIPAA-compliant patient management system
Requirements:
- Electronic Health Records (EHR) integration
- Telehealth video consultations
- Patient portal with secure messaging
- Insurance claim automation
- Mobile apps for iOS and Android
Budget: $250,000-400,000
Timeline: 10 months`,
        expectedKeywords: ["HIPAA", "healthcare", "EHR", "telehealth"]
    },
    {
        name: "Legacy Modernization",
        rawInput: `Client: National Bank of Commerce
Mission: Modernize 15-year-old COBOL core banking system
Requirements:
- Gradual migration to Node.js/TypeScript
- Zero downtime during transition
- Maintain regulatory compliance
- API-first architecture for fintech partnerships
- Performance improvement of 10x
Budget: $2,000,000-3,500,000
Timeline: 24 months`,
        expectedKeywords: ["COBOL", "modernization", "migration", "banking"]
    },
    {
        name: "Creative Agency Portfolio",
        rawInput: `Client: Nova Creative Studio
Mission: High-aesthetic interactive portfolio website
Requirements:
- Framer Motion animations throughout
- 3D WebGL elements (Three.js)
- Case study templates with video embedding
- CMS for easy content updates
- Performance score 95+ on Lighthouse
Budget: $40,000-60,000
Timeline: 2 months`,
        expectedKeywords: ["Framer", "animation", "portfolio", "WebGL"]
    },
    {
        name: "EdTech Platform",
        rawInput: `Client: LearnSmart Academy
Mission: Gamified learning platform with AI tutoring
Requirements:
- Personalized learning paths
- Real-time AI tutor for math and science
- Progress tracking and analytics
- Leaderboards and achievements
- Parent dashboard
Budget: $180,000-280,000
Timeline: 8 months`,
        expectedKeywords: ["gamification", "AI tutor", "learning", "education"]
    },
    {
        name: "Real Estate Data Hub",
        rawInput: `Client: PropertyVision Analytics
Mission: Map-based property analytics platform
Requirements:
- Google Maps integration with custom overlays
- Property valuation algorithms
- Market trend analysis
- Comparison tools for investors
- API for third-party integrations
Budget: $120,000-180,000
Timeline: 6 months`,
        expectedKeywords: ["Google Maps", "real estate", "analytics", "property"]
    },
    {
        name: "Global NGO RFP",
        rawInput: `Client: WorldHelp International
Mission: Multi-language resource distribution app for field workers
Requirements:
- Offline-first architecture
- Support for 15+ languages
- Low-bandwidth optimization
- GPS tracking for deliveries
- Simple UI for low-tech users
Budget: $60,000-90,000
Timeline: 4 months`,
        expectedKeywords: ["offline", "multi-language", "NGO", "low-bandwidth"]
    }
];

interface TestResult {
    scenario: string;
    projectId: string | null;
    steps: {
        createProject: boolean;
        generateEstimate: boolean;
        approveDraft: boolean;
        sendEmail: boolean;
        generateVibeGuide: boolean;
    };
    pdfGenerated: boolean;
    keywordsFound: string[];
    errors: string[];
}

async function runScenario(scenario: TestScenario): Promise<TestResult> {
    const result: TestResult = {
        scenario: scenario.name,
        projectId: null,
        steps: {
            createProject: false,
            generateEstimate: false,
            approveDraft: false,
            sendEmail: false,
            generateVibeGuide: false
        },
        pdfGenerated: false,
        keywordsFound: [],
        errors: []
    };

    try {
        // Step 1: Create project
        console.log(`[${scenario.name}] Creating project...`);
        const createRes = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Test: ${scenario.name}`,
                rawInput: scenario.rawInput
            })
        });

        if (!createRes.ok) throw new Error(`Create failed: ${createRes.status}`);
        const project = await createRes.json();
        result.projectId = project.id;
        result.steps.createProject = true;

        // Wait for AI processing
        await new Promise(r => setTimeout(r, 5000));

        // Step 2: Regenerate estimate to ensure we have content
        console.log(`[${scenario.name}] Generating estimate...`);
        const estimateRes = await fetch(`${API_BASE}/projects/${project.id}/regenerate-estimate`, {
            method: 'POST'
        });
        if (estimateRes.ok) {
            result.steps.generateEstimate = true;
        }

        // Wait for estimate generation
        await new Promise(r => setTimeout(r, 8000));

        // Step 3: Approve draft
        console.log(`[${scenario.name}] Approving draft...`);
        const approveRes = await fetch(`${API_BASE}/projects/${project.id}/approve-draft`, {
            method: 'POST'
        });
        if (approveRes.ok) {
            result.steps.approveDraft = true;
        }

        // Step 4: Send email
        console.log(`[${scenario.name}] Sending email...`);
        const emailRes = await fetch(`${API_BASE}/projects/${project.id}/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientEmail: 'test@example.com',
                emailSubject: `Proposal: ${scenario.name}`,
                emailBody: 'Test email body'
            })
        });
        if (emailRes.ok) {
            result.steps.sendEmail = true;
        }

        // Step 5: Generate vibe guide
        console.log(`[${scenario.name}] Generating vibe guide...`);
        const guideRes = await fetch(`${API_BASE}/projects/${project.id}/generate-vibe-guide`, {
            method: 'POST'
        });
        if (guideRes.ok) {
            result.steps.generateVibeGuide = true;
        }

        // Check PDF availability
        console.log(`[${scenario.name}] Checking PDF...`);
        const pdfRes = await fetch(`${API_BASE}/projects/${project.id}/proposal.pdf`, {
            method: 'HEAD'
        });
        result.pdfGenerated = pdfRes.ok;

        // Fetch final project and check for keywords
        const finalProject = await (await fetch(`${API_BASE}/projects/${project.id}`)).json();
        const allContent = [
            finalProject.estimateMarkdown || '',
            finalProject.researchMarkdown || '',
            finalProject.vibecodeGuideA || ''
        ].join(' ').toLowerCase();

        for (const keyword of scenario.expectedKeywords) {
            if (allContent.includes(keyword.toLowerCase())) {
                result.keywordsFound.push(keyword);
            }
        }

    } catch (error: any) {
        result.errors.push(error.message);
    }

    return result;
}

async function runDecathlon() {
    console.log('='.repeat(60));
    console.log('ISI v2.0 DECATHLON STRESS TEST');
    console.log('='.repeat(60));
    console.log(`Running ${scenarios.length} scenarios...\n`);

    const results: TestResult[] = [];

    for (const scenario of scenarios) {
        console.log(`\n--- Testing: ${scenario.name} ---`);
        const result = await runScenario(scenario);
        results.push(result);

        const steps = Object.values(result.steps).filter(Boolean).length;
        const status = steps === 5 && result.pdfGenerated ? '✓ PASS' : '✗ FAIL';
        console.log(`${status} - ${steps}/5 steps, PDF: ${result.pdfGenerated}, Keywords: ${result.keywordsFound.length}/${scenario.expectedKeywords.length}`);

        // Small delay between scenarios
        await new Promise(r => setTimeout(r, 2000));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));

    let passed = 0;
    for (const result of results) {
        const steps = Object.values(result.steps).filter(Boolean).length;
        const isPass = steps === 5 && result.pdfGenerated;
        if (isPass) passed++;

        console.log(`${isPass ? '✓' : '✗'} ${result.scenario}`);
        console.log(`  Steps: ${steps}/5, PDF: ${result.pdfGenerated}, Keywords: ${result.keywordsFound.join(', ') || 'none'}`);
        if (result.errors.length > 0) {
            console.log(`  Errors: ${result.errors.join(', ')}`);
        }
    }

    console.log(`\nTotal: ${passed}/${results.length} passed (${Math.round(passed / results.length * 100)}%)`);

    // Write results to file
    const fs = await import('fs');
    fs.writeFileSync(
        'decathlon_results.json',
        JSON.stringify(results, null, 2)
    );
    console.log('\nResults saved to decathlon_results.json');
}

runDecathlon().catch(console.error);
