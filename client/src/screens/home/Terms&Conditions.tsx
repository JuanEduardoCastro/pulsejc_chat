import NavBar from '@/components/home/NavBar';
import Footer from '@/components/home/Footer';

function TermsAndConditions() {
  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <NavBar actions="both" />
      <Footer />
    </div>
  );
}

export default TermsAndConditions;
