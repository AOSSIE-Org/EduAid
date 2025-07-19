import { Link } from 'react-router-dom';

export default function FAQ() {
  const faqs = [
    {
      question: "How do I generate a quiz?",
      answer: "Click 'Let's get Started', enter your topic or upload content, and select your preferred quiz settings."
    },
    {
      question: "What types of questions can EduAid generate?",
      answer: "We support multiple-choice, true/false, short answer, and matching questions."
    },
    {
      question: "Can I use PDFs or documents as input?",
      answer: "Yes! Upload PDFs, Word docs, or paste text directly into the input field."
    },
    {
      question: "How many questions can I generate at once?",
      answer: "The free version allows up to 20 questions per quiz. Premium users can generate 50+ questions."
    },
    {
      question: "Why are some generated questions inaccurate?",
      answer: "Accuracy depends on input quality. For best results, provide clear context and proofread generated questions."
    },
    {
      question: "Can I edit generated questions?",
      answer: "Absolutely! All questions can be modified before finalizing your quiz."
    },
    {
      question: "How do I share quizzes with students?",
      answer: "Export as Google Forms, PDF, or share via direct link (premium feature)."
    },
    {
      question: "Is there a history of my generated quizzes?",
      answer: "Yes! Visit 'Your previous Work' to see all your saved quizzes."
    },
    {
      question: "What languages does EduAid support?",
      answer: "Currently English only, with Spanish and French coming soon."
    },
    {
      question: "How do I report a bug or request a feature?",
      answer: <>Visit our <a href="https://github.com/AOSSIE-Org/EduAid/issues" className="text-[#00CBE7] hover:underline">GitHub Issues</a> page or contact support@eduaid.example</>
    }
  ];

  return (
    <div className="w-screen min-h-screen bg-[#02000F] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
            <span className="text-white"> FAQs</span>
          </h1>
          <p className="text-xl text-gray-300">Quick answers to common questions</p>
        </div>

        {/* FAQ List */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[#0F0F1A] rounded-xl p-6 shadow-lg border border-[#1E1E2D] hover:border-[#00CBE7] transition-all">
              <h3 className="text-xl font-bold text-[#00CBE7] mb-2">{faq.question}</h3>
              <p className="text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center text-lg text-white bg-[#FF005C] hover:bg-[#7600F2] px-6 py-3 rounded-lg transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}