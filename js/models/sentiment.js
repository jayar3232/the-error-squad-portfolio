// Compact English sentiment classifier. Training data below are original labeled
// snippets. The multinomial naive Bayes model learns word likelihoods at startup.
// It evaluates new text locally; there is no network call or text lookup table.
(() => {
  'use strict';
  const api = window.StudioModels ||= {};
  const corpus = {
    Positive: [
      'I love the lovely friendly design. We loved the colors.',
      'Great result, excellent choice, outstanding quality.',
      'The clear instructions were useful and helpful.',
      'Beautiful work. This looks fantastic and amazing.',
      'The setup is easy and straightforward. It works perfectly.',
      'I like the smooth navigation and fast response.',
      'Happy customers were pleased and delighted.',
      'We enjoyed the fun game. Enjoyable levels kept me smiling.',
      'Thank you for the wonderful support. I appreciate your help.',
      'I highly recommend this reliable and impressive tool.',
      'Brilliant thoughtful details make this project a success.',
      'Good performance. The improved layout feels better.',
      'I am proud of the progress and excited for the launch.',
      'A clean elegant, professional and polished result.',
      'The kind and supportive team was patient and welcoming.',
      'The best feature is its intuitive, simple interface.',
      'I am satisfied and grateful. It feels comfortable to use.',
      'Superb implementation, awesome presentation. Worth the effort.',
      'It worked beautifully and exceeded my expectations.',
      'This is perfect. I trust this excellent product.',
      'Everything feels smooth, quick, accurate and responsive.',
      'I liked the dashboard. The changes are a welcome improvement.',
      'The interface is delightful, pleasant and convenient.',
      'This was a positive experience. I really enjoyed it.',
      'My favorite part is the creative, elegant artwork.'
    ],
    Negative: [
      'I hate the awful broken design. We hated the colors.',
      'Bad result, poor choice, terrible quality.',
      'The unclear instructions were useless and unhelpful.',
      'Ugly work. This looks horrible and disappointing.',
      'The setup is difficult and complicated. It fails repeatedly.',
      'I dislike the confusing navigation and slow response.',
      'Unhappy customers were upset and disappointed.',
      'The annoying game frustrated me. Frustrating levels felt tedious.',
      'We regret the miserable support and rude replies.',
      'I cannot recommend this unreliable tool because it freezes.',
      'Careless details made this project a failure.',
      'Poor performance. The layout feels worse.',
      'I worry about the progress and dread the launch.',
      'A messy, cluttered and unprofessional result.',
      'The impatient team was hostile and dismissive.',
      'The worst feature is its confusing, cumbersome interface.',
      'I am dissatisfied and annoyed. It feels uncomfortable to use.',
      'Broken implementation, boring presentation. A waste of effort.',
      'It crashed and lost my work. It failed my expectations.',
      'This is terrible. I distrust this defective product.',
      'Everything feels sluggish, inaccurate, buggy and unresponsive.',
      'I disliked the dashboard. Errors and crashes interrupted work.',
      'The interface is unpleasant and inconvenient.',
      'This was a negative experience. I really despised it.',
      'The endless delays left me angry, stressed and sad.'
    ],
    Neutral: [
      'The gallery contains three prints. There are eight projects.',
      'I opened the page on Tuesday and selected the first item.',
      'The meeting is scheduled for tomorrow morning.',
      'The dashboard shows a table with rows and columns.',
      'We entered a number and received a result.',
      'The team uploaded a file to the project folder.',
      'This report lists the available settings and options.',
      'The preview displays the selected image in a frame.',
      'There is a button beside the main navigation.',
      'The form asks for a name, email address and message.',
      'A local copy was saved yesterday.',
      'The calculator supports four arithmetic operations.',
      'There are two labels and a heading on the page.',
      'The weather panel provides temperature and wind speed.',
      'The camera can capture video frames at this resolution.',
      'We reviewed the notes in class this afternoon.',
      'The account belongs to a member of the group.',
      'The application runs in a browser window.',
      'This version has a search field and category filters.',
      'The documentation includes setup instructions.',
      'The group will give a presentation at ten.',
      'These are sample observations about the classroom.',
      'Today we checked the current file size.',
      'I read the introduction and returned to the home page.',
      'The project is located in the activities directory.'
    ]
  };
  const stopWords = new Set(('a an the it are is was were its this these those we our us you your i my me they their of in at to and for from with by as about on when have has had very really can could would will should every each part made most more then also am be been how').split(' '));
  const negatives = new Set(['not','never','no','cannot']);
  const tokens = text => text.toLowerCase().replaceAll('’', "'").replace(/n\x27t\b/g, ' not').match(/[a-z]+|[.!?,;:]/g) || [];
  const labels = Object.keys(corpus);
  const counts = {}, totals = {}, vocabulary = new Set();
  for (const label of labels) {
    const tally = counts[label] = new Map();
    totals[label] = 0;
    for (const line of corpus[label]) {
      for (const token of tokens(line)) {
        if (!/[a-z]/.test(token) || stopWords.has(token) || negatives.has(token)) continue;
        vocabulary.add(token);
        tally.set(token, (tally.get(token) || 0) + 1);
        totals[label]++;
      }
    }
  }
  api.sentiment = async text => {
    if (typeof text !== 'string' || !text.trim()) throw new Error('Enter some English text to analyze.');
    const logProb = Object.fromEntries(labels.map(label => [label, Math.log(1 / labels.length)]));
    const positive = new Set(), negative = new Set();
    let negation = 0, evidence = 0;
    for (const token of tokens(text)) {
      if (negatives.has(token)) { negation = 3; continue; }
      if (!/[a-z]/.test(token) || /^(but|however|although)$/.test(token)) { negation = 0; continue; }
      if (stopWords.has(token)) continue;
      const inverted = negation > 0;
      negation = Math.max(0, negation - 1);
      if (!vocabulary.has(token)) continue;
      const likelihood = {};
      for (const label of labels) {
        likelihood[label] = Math.log(((counts[label].get(token) || 0) + 1) / (totals[label] + vocabulary.size));
      }
      if (inverted) [likelihood.Positive, likelihood.Negative] = [likelihood.Negative, likelihood.Positive];
      for (const label of labels) logProb[label] += likelihood[label];
      evidence++;
      // Report only discriminating features, excluding common topic words.
      const strongest = labels.toSorted ? labels.toSorted((a,b) => likelihood[b] - likelihood[a]) : [...labels].sort((a,b) => likelihood[b] - likelihood[a]);
      if (likelihood[strongest[0]] - likelihood[strongest[1]] > 0.38) {
        const cue = inverted ? 'not ' + token : token;
        if (strongest[0] === 'Positive') positive.add(cue);
        if (strongest[0] === 'Negative') negative.add(cue);
      }
    }
    const peak = Math.max(...Object.values(logProb));
    const weights = Object.fromEntries(labels.map(label => [label, Math.exp(logProb[label] - peak)]));
    const total = Object.values(weights).reduce((a,b) => a+b,0);
    const score = (weights.Positive - weights.Negative) / total;
    const mixed = positive.size > 0 && negative.size > 0;
    let label = labels.reduce((best,next) => weights[best] >= weights[next] ? best : next);
    if (!evidence || Math.abs(score) < 0.12 || (!positive.size && !negative.size)) label = 'Neutral';
    const explanation = !evidence ? 'No words matched the English training vocabulary.'
      : mixed ? 'The text contains both favorable and unfavorable cues. The score summarizes their balance.'
      : label === 'Neutral' ? 'The model found mostly factual wording or little evidence of a clear polarity.'
      : 'The English classifier found more evidence for a ' + label.toLowerCase() + ' reading.';
    return {label,score,positive:[...positive],negative:[...negative],mixed,explanation,engine:'Local English naive Bayes'};
  };
})();
