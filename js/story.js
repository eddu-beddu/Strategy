/* =============================================================
   story.js — Narration that sits between the fighting: the
   opening, the interludes after each chapter, and the epilogues.
   ============================================================= */
(function (FE) {
  'use strict';

  FE.OPENING = {
    title: 'The March of Vale',
    lines: [
      'A march is a border. That is all the word ever meant.',
      'It is the piece of a kingdom that is nearest to whatever the kingdom is afraid of,',
      'and in exchange for standing there, the family that holds it is left alone.',
      '',
      'Vale held its border for two hundred years. It had a road, a silver mine,',
      'nine hundred people and one bad season after another.',
      '',
      'This is the story of the eleven days after it stopped.'
    ]
  };

  /* INTERLUDES[i] plays after chapter i is won. */
  FE.INTERLUDES = {
    0: {
      title: 'On the south road',
      lines: [
        'They walked until the smoke was behind the hill and then they stopped, because Garrick',
        'would not go further until somebody said the thing he had been carrying since noon.',
        '',
        'GARRICK: A bandit takes the grain. He does not burn it. Grain is the reason he came.',
        'RODERIC: Perhaps they were interrupted.',
        'GARRICK: By whom? We were three hours away.',
        '',
        'ALERYN: Say it plainly.',
        'GARRICK: Somebody paid them to burn Vale, my lady. Not to rob it. To end it.',
        '',
        'Nobody argued. That was the worst part of it.'
      ]
    },
    1: {
      title: 'The seal',
      lines: [
        'MIRA: I have seen that wax on abbey letters. It is crown wax.',
        'ISOLDE: It is *unmistakably* crown wax, which is the part I dislike.',
        'RODERIC: A company could steal a seal.',
        'ISOLDE: A company could steal a seal. A company could not steal the wax, the die, the',
        '  countersign and the correct clerk’s hand all at once, and then get the colour right.',
        '',
        'ALERYN: You are telling me the capital paid for it.',
        'ISOLDE: I am telling you what the evidence says. What I am *telling* you is that',
        '  evidence of this kind has a way of being about someone much closer to home.'
      ]
    },
    2: {
      title: 'What a warden said',
      lines: [
        'ALERYN: He said the march was forfeit. Signed over.',
        'ISOLDE: Yes.',
        'ALERYN: A warden cannot sign away a march.',
        'ISOLDE: No.',
        'ALERYN: A company cannot. A castellan cannot. The crown cannot, not without cause.',
        'ISOLDE: No, no, and not easily.',
        '',
        'ALERYN: Then say the name, Isolde, because I have been carrying it up this road since',
        '  the ford and I would like somebody else to hold it for a while.',
        'ISOLDE: ...Your father.',
        '',
        'ALERYN: Thank you.',
        'ISOLDE: I am sorry.',
        'ALERYN: Do not be sorry yet. We have not read the ledger.'
      ]
    },
    3: {
      title: 'A night in the open',
      lines: [
        'They had come out of the abbey with nothing but what they carried, which for Sable',
        'turned out to be a surprising amount.',
        '',
        'SABLE: Two candles, a whetstone, the almoner’s knife, and this.',
        'MIRA: That is a reliquary.',
        'SABLE: It is a *box*, and there is a road ahead of us with nothing on it to eat.',
        'MIRA: ...Put the saint back in it before you sell it.',
        'SABLE: I would not dream of selling the saint. The saint is the expensive part.',
        '',
        'ALERYN, later, to nobody: If the ledger says what I think it says,',
        'then every person who died in Vale died because of a signature. Not a battle.',
        'Not even a betrayal, exactly. An arrangement.'
      ]
    },
    4: {
      title: 'The ledger',
      lines: [
        'Bern brought it out wrapped in oilcloth and put it on a barrel and stood back,',
        'like a man who did not want to be near it when it was opened.',
        '',
        'It was in a clerk’s hand and it was very neat.',
        '',
        '  — Debts of the March of Vale, carried nine years, compounding.',
        '  — Security offered: the silver vein at Vale, its road, and the march entire.',
        '  — Purchaser: Lord Varen of Hask.',
        '  — Countersigned, Treasury, in settlement.',
        '  — Dated eleven days before the burning.',
        '',
        'RODERIC: It was to be bloodless. Look — there, the clause. Quiet transfer at the turn',
        '  of the season. Nobody was supposed to be there.',
        'KESTREL: Nine hundred people lived there, Roderic.',
        'RODERIC: I know what I am saying. I am saying he told himself it would be bloodless.',
        '',
        'ALERYN: Sable. How long to copy it?'
      ]
    },
    5: {
      title: 'Four riders',
      lines: [
        'TAM: You understand that the copies change nothing legally.',
        'ISOLDE: They change everything *publicly*, which is a different and better weapon.',
        'TAM: Only if someone in the capital cares more about being embarrassed than about',
        '  being owed money. In my experience that is not the way to bet.',
        '',
        'ALERYN: I am not betting on the capital. I am making sure that when I do what I am',
        'going to do, there is a version of why, somewhere, that is not the version they write.'
      ]
    },
    6: {
      title: 'The tube of wax',
      lines: [
        'The Sky Captain’s warrant was three lines long and perfectly clear.',
        '',
        'ISOLDE: It is legal. I want to be very exact, because you are going to hate it.',
        '  Varen did not steal Vale. He bought it, from its lord, at a fair price, and the',
        '  crown countersigned, and the clerks filed it, and it is *legal*.',
        '',
        'ALERYN: And the raid?',
        'ISOLDE: The raid is the only illegal thing in the whole affair, and the man who',
        '  ordered it is the one man you cannot punish, because he is already dead,',
        '  and because he was your father.',
        '',
        'HALLOW, from the dark, not looking up: There is a mine at the end of this.',
        'ALERYN: There is.',
        'HALLOW: Go and look at it. You will want to have seen it.'
      ]
    },
    7: {
      title: 'Before Varen',
      lines: [
        'They could see the castle from the ridge by midmorning. It was in good repair.',
        'Somebody had rethatched the gate-town in the spring.',
        '',
        'GARRICK: It is not a bad lord, then. Whatever else he is.',
        'BERN: No. He pays on time. That is the whole of what I know about him.',
        '',
        'MIRA: If you do this, there is no coming back from it. You know that.',
        'ALERYN: I know.',
        'MIRA: And you are doing it anyway.',
        'ALERYN: Mira — nine hundred people burned so that a ledger would balance.',
        '  Somebody has to make it cost something. If the law will not, then I will,',
        '  and I will be wrong, and it will still have cost something.',
        '',
        'MIRA: ...Then I am coming up the hill with you.',
        'ALERYN: I never doubted it for a moment.'
      ]
    }
  };

  /* One line per survivor at the end, plus a fallback. */
  FE.EPILOGUES = {
    aleryn: 'Aleryn of Vale was declared outlaw within the month and was never taken. The copies of the ledger surfaced in four cities that winter; two were burned, one was read aloud in a market, and one is still in a library, catalogued under Land Disputes.',
    roderic: 'Roderic went back to the hill and rebuilt the west gate, wide, with his own hands and other people’s money. He would not say whose.',
    garrick: 'Garrick planted the burnt wood. He did not live to see it tall, but he lived to see it past his own height, which he said was the only bit he had been worried about.',
    kestrel: 'Kestrel drafted the deer law herself, had it sealed properly, and framed it. The law was never enforced by anyone, which she considered the point.',
    mira: 'Mira went to the college with Isolde, took orders anyway, and spent thirty years arguing that an abbey which turns anyone away has misunderstood its own foundation.',
    isolde: 'Isolde published four papers on the forging of seals and one, anonymously, on how to read a treasury countersign. The anonymous one was the useful one.',
    sable: 'Sable never stole anything again, except documents, which she maintained was a separate activity with a different moral character.',
    bern: 'Bern held the Iron Gate for another nine years, for Vale, unpaid, and turned back three tax columns and one army.',
    tam: 'Tam was paid in full and stayed six years past the end of the contract. He never offered an explanation and nobody was rude enough to ask for one.',
    elowen: 'Elowen carried the last copy of the ledger over the mountains in eleven days and delivered it to a man who did nothing with it. She flew back anyway.',
    hallow: 'Hallow considered the debt paid and went home. Nobody had known there was a home to go to.'
  };

  FE.EPILOGUE_FALLEN = 'fell in the fighting and was buried on the road';
})(window.FE);
