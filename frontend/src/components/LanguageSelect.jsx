import { Globe2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function LanguageSelect({ className = '' }) {
  const { language, setLanguage, t } = useLanguage();
  return <label className={`language-control ${className}`}>
    <Globe2 size={16} aria-hidden="true" />
    <span className="sr-only">{t('Choose language')}</span>
    <select value={language} onChange={event => setLanguage(event.target.value)} aria-label={t('Choose language')}>
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
      <option value="hi">हिन्दी</option>
    </select>
  </label>;
}
