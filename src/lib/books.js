// Central book data — 1 book = 1 entry, formats embedded
export const books = [
  {
    id: 'si-javais-su-a-16-ans',
    title: "Si j'avais su à 16 ans",
    author: 'Sohan Adou',
    coverSrc: 'https://media.base44.com/images/public/69e157c4e5760ca5035c57bd/09a57da28_image.png',
    tagline: 'Les leçons que l\'on aurait aimé recevoir plus tôt.',
    description: "Si j'avais su à 16 ans est bien plus qu'un témoignage : c'est une lettre à tous ceux qui traversent cet âge où tout semble possible, mais où les pièges sont nombreux. Premier ouvrage d'une série qui accompagnera chaque étape cruciale de la vie tous les cinq ans, ce livre pose un regard authentique et sans filtre sur une jeunesse marquée par les épreuves et la grâce.\n\nJ'aborde sans tabou les événements qui m'ont façonné : une naissance miraculeuse, une addiction à la lean, des choix douloureux et surtout, une délivrance puissante grâce à Jésus-Christ. J'y partage aussi des conseils concrets sur les choix d'études, la gestion de l'anxiété, la recherche du bonheur véritable, et ce que signifie vraiment rencontrer Dieu.\n\nSi j'avais su à 16 ans que mes erreurs ne me définissaient pas. Que les difficultés sont normales. Qu'une confiance sincère en Dieu change absolument tout.\n\nCe livre est une invitation à la réflexion et un compagnon de route. Que tu aies 16 ans ou que tu t'en souviennes, je crois qu'il éclairera ton chemin. Et si tu termines ces pages, je t'encourage à adresser à Dieu une simple et sincère prière, c'est souvent là que tout commence.",
    points: [
      'Un témoignage sans tabou',
      'Des conseils concrets sur les études, le bonheur et la foi',
      'Premier tome d\'une série qui accompagne chaque étape de la vie',
      'Une invitation sincère à rencontrer Dieu et à ne pas se laisser définir par ses erreurs',
    ],
    testimonials: [
      { text: "Ce livre m'a parlé comme si l'auteur me connaissait personnellement. J'avais 17 ans quand je l'ai lu, et ça a tout changé.", author: 'Aminata K.' },
      { text: "Honnête, sans fard, et plein de sagesse. Exactement ce qu'on aurait voulu entendre à cet âge.", author: 'Koffi M.' },
      { text: "La partie sur la lean et la délivrance m'a touché en plein cœur. Un témoignage rare et courageux.", author: 'Christelle B.' },
    ],
    amazonUrl: 'https://www.amazon.fr/-/en/SI-JAVAIS-À-16-ANS/dp/B0GV8R44GX',
    ebookPriceFCFA: 5000,
    physiquePriceFCFA: 7000,
    formats: [
      { id: 'si-javais-su-a-16-ans-ebook',    label: 'E-book PDF', price: 5000,  category: 'ebook',    badge: 'Ebook',    format: 'Ebook PDF',    delivery: 'Téléchargement immédiat après paiement' },
      { id: 'si-javais-su-a-16-ans-physique',  label: 'Livre physique', price: 7000, category: 'physique', badge: 'Physique', format: 'Livre physique', delivery: 'Livraison en 7 à 15 jours ouvrés' },
    ],
  },
  {
    id: 'dieu-connait-ton-nom',
    title: 'Dieu connaît ton nom',
    author: 'Sohan Adou',
    coverSrc: 'https://media.base44.com/images/public/69e157c4e5760ca5035c57bd/f65254426_image.png',
    tagline: 'Un livre qui parle à l\'âme.',
    description: "Tu portes quelque chose que tu n'arrives pas à lâcher. Des erreurs que tu ne peux pas oublier. Des blessures qui refusent de guérir. Des voix qui te répètent que tu n'es pas assez, que tu ne mérites pas mieux, que tu es condamné par ce que tu as fait ou ce qu'on t'a fait.\n\nMais et si tout cela était un mensonge ?\n\nDans ce premier tome, découvre une vérité qui change tout : ton passé ne définit pas ton identité. Dieu ne te voit pas à travers tes échecs. Il ne te connaît pas par ta honte. Il te connaît par ton nom. Et quand Il t'appelle, c'est pour te dire que tu n'as jamais été oublié, jamais été un accident, jamais été trop loin pour être atteint.\n\nIl est temps de tourner la page. Non pas en niant ce qui s'est passé, mais en comprenant que Dieu veut écrire un nouveau chapitre dans ta vie.\n\nPrêt à commencer ?",
    points: [
      'Une vérité libératrice : ton passé ne définit pas ton identité',
      'Un message pour ceux qui portent des blessures et des erreurs',
      'Une invitation à croire que Dieu t\'appelle par ton nom',
      'Premier tome d\'une série sur la foi, la grâce et la restauration',
    ],
    testimonials: [
      { text: "J'avais honte de mon passé depuis des années. Ce livre m'a redonné la paix que je pensais avoir perdue pour toujours.", author: 'Sandra T.' },
      { text: "Une lecture qui libère. Après des années à me croire trop loin de Dieu, ce livre m'a rappelé que non.", author: 'David N.' },
      { text: "Simple, direct, et profond. Chaque page m'a rappelé que mon identité ne se résume pas à mes erreurs.", author: 'Fatou D.' },
    ],
    amazonUrl: 'https://www.amazon.fr/-/en/DIEU-CONNAÎT-TON-NOM-Oublie/dp/B0GV8P5SL8',
    ebookPriceFCFA: 5000,
    physiquePriceFCFA: 7000,
    formats: [
      { id: 'dieu-connait-ton-nom-ebook',    label: 'E-book PDF',    price: 5000,  category: 'ebook',    badge: 'Ebook',    format: 'Ebook PDF',    delivery: 'Téléchargement immédiat après paiement' },
      { id: 'dieu-connait-ton-nom-physique', label: 'Livre physique', price: 7000, category: 'physique', badge: 'Physique', format: 'Livre physique', delivery: 'Livraison en 7 à 15 jours ouvrés' },
    ],
  },
];

export function getBookById(id) {
  return books.find(b => b.id === id);
}

// Legacy compat: find a book by a format id (e.g. "si-javais-su-a-16-ans-ebook")
export function getBookByFormatId(formatId) {
  return books.find(b => b.formats.some(f => f.id === formatId));
}
