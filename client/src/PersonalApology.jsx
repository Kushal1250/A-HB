import './personal-apology.css';
export default function PersonalApology({position}) {
  return <aside className={`personal-apology personal-apology-${position}`} aria-label="A personal apology">
    <span aria-hidden="true">❧</span>
    <p>I’m sorry if I have hurt you with any word, sentence, message, or anything else.</p>
  </aside>;
}
