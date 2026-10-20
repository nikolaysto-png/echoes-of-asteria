// Data-driven NPC scripts. The event interpreter understands every command
// used here; nothing in this file is a placeholder.

export const TRAINERS = {
  pell: {
    id: 'pell', name: 'Scout Pell', sprite: 'boy', smart: false, music: 'battle',
    intro: 'The road is all puddles and tall grass today. Let’s see how you handle both!',
    reward: { money: 240 },
    party: [{ species: 'pufflet', level: 6 }, { species: 'leafkin', level: 6 }]
  },
  orin: {
    id: 'orin', name: 'Captain Orin', sprite: 'orin', smart: true, music: 'battle',
    intro: 'You want the road? Then show me you can hold it.',
    reward: { money: 420 },
    party: [{ species: 'dunekin', level: 8 }, { species: 'gustwing', level: 7 }]
  },
  mira: {
    id: 'mira', name: 'Mira', sprite: 'mira', smart: true, music: 'rival',
    intro: 'You can hear it, can’t you? The hum. Show me your Echo is louder.',
    reward: { money: 640, items: [{ id: 'greatball', amount: 2 }] },
    party: [{ species: 'shadowtail', level: 9 }, { species: 'bloomwing', level: 9 }, { species: 'sparkbit', level: 8 }]
  },
  rook: {
    id: 'rook', name: 'Delver Rook', sprite: 'fisher', smart: true, music: 'battle',
    intro: 'Nobody comes down here without a reason. Show me yours.',
    reward: { money: 520, items: [{ id: 'balm', amount: 1 }] },
    party: [{ species: 'stoneclaw', level: 10 }, { species: 'brawlfin', level: 9 }]
  },
  rowan: {
    id: 'rowan', name: 'Rowan', sprite: 'rowan', smart: true, music: 'arena',
    intro: 'Nine years undefeated. If you came to end that, come at me with everything.',
    reward: { money: 1800, items: [{ id: 'elixir', amount: 2 }, { id: 'greatball', amount: 3 }] },
    party: [
      { species: 'voltrat', level: 14 },
      { species: 'granitejaw', level: 15 },
      { species: 'cinderwing', level: 16 }
    ]
  }
};

export const SHOP_STOCKS = {
  lumen: {
    name: 'Sundry Goods',
    stock: ['salve', 'antidote', 'burnsalve', 'wakeleaf', 'echoball']
  },
  halvern: {
    name: 'Halvern Exchange',
    stock: ['salve', 'balm', 'elixir', 'antidote', 'burnsalve', 'wakeleaf', 'feather', 'echoball', 'greatball', 'ultraball']
  }
};

const say = (lines, speaker) => ({ say: lines, speaker });

export const SCRIPTS = {
  home_intro: [
    say([
      'The tide is already high. You can hear it through the window, counting the morning.',
      'Today you are supposed to visit Professor Vale’s laboratory. His note is still folded on the desk.',
      'Your mother is by the table. She has been pretending not to watch you leave.'
    ]),
    { set: { flag: 'intro_seen', value: true } }
  ],

  mom: [
    {
      if: { notFlag: 'got_starter' },
      then: [
        say([
          'Good morning, sleepyhead. Vale has been up since dawn. You know how he gets.',
          'He said he has three young Echoes waiting. Three! And one of them is meant for you.',
          'Go on. I will keep the kettle warm.'
        ], 'Mara'),
        { set: { flag: 'mom_met', value: true } }
      ],
      else: [
        { if: { flag: 'chapter_complete' }, then: [
          say(['You came back. I knew you would.', 'Sit down before you fall down. The kettle is still warm.'], 'Mara')
        ], else: [
          say([
            'You look taller than you did this morning. Or maybe that is just the road.',
            'Rest when you need to. The world will still be there when you wake.'
          ], 'Mara')
        ] }
      ]
    },
    { choice: { prompt: 'Rest here and restore your party?', options: [
      { label: 'Yes', commands: [
        say(['You sleep for an hour. The tide fills the bay and empties it again.'], 'Mara'),
        { heal: true, respawn: { map: 'home', x: 6, y: 7 } },
        say(['Your Echoes wake up bright-eyed and ready.'], 'Mara')
      ] },
      { label: 'No', commands: [say(['Off again, then. Take care.'], 'Mara')] }
    ] } }
  ],

  vale: [
    {
      if: { notFlag: 'got_starter' },
      then: [
        say([
          'Ah. There you are. I was beginning to think the tide had carried you off.',
          'I am Vale. I study the Resonance — the low hum under Asteria. It has been getting louder.',
          'Three young Echoes have been waiting for a field partner. They have opinions about it.'
        ], 'Professor Vale'),
        { starter: true },
        {
          if: { flag: 'got_starter' },
          then: [
            say([
              'A good match. You can tell by the way it is already watching the door.',
              'Take these as well. Five Echo Balls, and salves for the road.'
            ], 'Professor Vale'),
            { giveItem: 'echoball', qty: 5 },
            { giveItem: 'salve', qty: 3 },
            { set: { flag: 'got_balls', value: true } },
            say([
              'Captain Orin keeps the coast road east of town. He is stubborn, but fair.',
              'Let him see your Echo. And be careful in the tall grass — not everything is friendly.'
            ], 'Professor Vale')
          ]
        }
      ],
      else: [
        {
          if: { flag: 'chapter_complete' },
          then: [
            say([
              'The Resonance has changed key. It is quieter now, but I would not call it gone.',
              'The shard you found is in my desk. It still hums, if you listen closely.',
              'Rest, explorer. The road east is open now, and Emberfall will want to meet you.'
            ], 'Professor Vale')
          ],
          else: [
            {
              if: { notFlag: 'got_balls' },
              then: [
                say(['Ah, you still need field supplies.'], 'Professor Vale'),
                { giveItem: 'echoball', qty: 5 },
                { giveItem: 'salve', qty: 3 },
                { set: { flag: 'got_balls', value: true } },
                say(['There. That should hold you until Halvern.'], 'Professor Vale')
              ]
            },
            {
              if: { flag: 'got_shard' },
              then: [
                say([
                  'That shard came from the altar under the Whisperwood. You can hear what it is doing to the light.',
                  'Rowan is in the Coiled Arena. Nine years undefeated. If anyone can read that hum, it is him.',
                  'The arena is south of Halvern Market. Do not go in half-prepared.'
                ], 'Professor Vale')
              ],
              else: [
                say([
                  'The road east is where the hum is strongest. Cross the coast, then the wood.',
                  'Mira has been mapping the Resonance. She is sharp, and she will not let you pass without a battle.',
                  'Take care. The wild Echoes are restless.'
                ], 'Professor Vale')
              ]
            }
          ]
        }
      ]
    }
  ],

  orin: [
    {
      if: { notFlag: 'got_starter' },
      then: [say(['Hold there. No one walks the coast road without an Echo at their side.', 'Go and see Vale. Then we can talk.'], 'Captain Orin')],
      else: [
        {
          if: { notFlag: 'road_open' },
          then: [
            say([
              'Captain Orin. I keep this road.',
              'Two survey markers went missing this month. The grass moves when the wind is still.',
              'I will not let you east until I know you can handle what is out there.',
              'One battle. Then the road is yours.'
            ], 'Captain Orin'),
            {
              battle: 'orin',
              win: [
                { set: { flag: 'road_open', value: true } },
                say([
                  'Enough. The road is yours.',
                  'Mind the western shallows. The tide comes in faster than it used to.',
                  'Mira is somewhere past the next bend. She will probably want a battle too.'
                ], 'Captain Orin')
              ]
            }
          ],
          else: [say(['The road is quiet. That is the best news I have had in a month.', 'Stay on the path. And watch the grass.'], 'Captain Orin')]
        }
      ]
    }
  ],

  pell: [
    {
      if: { notFlag: 'pell_beaten' },
      then: [
        say([
          'Scout Pell, survey corps. Well — former survey corps.',
          'There are three kinds of people on this road: travellers, Echoes, and people who become travellers very suddenly.',
          'Which kind are you?'
        ], 'Scout Pell'),
        {
          battle: 'pell',
          win: [
            { set: { flag: 'pell_beaten', value: true } },
            say(['Ha! The fourth kind: someone who wins.', 'Take the road east. You will know Mira when you see her. She has a map and no patience.'], 'Scout Pell')
          ]
        }
      ],
      else: [
        say(['Go on. Mira is past the next bend, and she has already asked about you twice.'], 'Scout Pell')
      ]
    }
  ],

  mira: [
    {
      if: { notFlag: 'mira_battle_done' },
      then: [
        say([
          'Oh good. A real Echo.',
          'I am Mira. I have been mapping the Resonance hum for two years and nobody believes a word of it.',
          'But you are about to find out whether it can fight. Battle me. Right now.',
          'Do not be gentle. I will not be.'
        ], 'Mira'),
        {
          battle: 'mira',
          win: [
            { set: { flag: 'mira_battle_done', value: true } },
            { giveItem: 'greatball', qty: 2 },
            say([
              'Fine. Fine! You are good. I hate that you are good.',
              'The cave north of the clearing is where the hum gets loudest. Selene is there.',
              'Take these. You will need them more than I do.'
            ], 'Mira')
          ]
        }
      ],
      else: [
        { if: { flag: 'chapter_complete' }, then: [
          say([
            'Nine years. You ended it.',
            'The hum changed after you came back. So did the light in the trees.',
            'Do not let it go to your head. I am still going to beat you someday.'
          ], 'Mira')
        ], else: [
          say(['The cave is north of the clearing. Selene is already down there, being ominous.', 'I am staying here. Someone has to document this.'], 'Mira')
        ] }
      ]
    }
  ],

  rook: [
    {
      if: { notFlag: 'rook_beaten' },
      then: [
        say([
          'Nobody comes down here without a reason.',
          'I am Rook. I dig where the hum is loudest, and I have not found the bottom yet.',
          'If you are going deeper, you will have to get past me.'
        ], 'Delver Rook'),
        {
          battle: 'rook',
          win: [
            { set: { flag: 'rook_beaten', value: true } },
            say(['Hah. Good. The altar is north of here, past the blue stone.', 'Do not touch the crack with your bare hand. Or do. It is your story.'], 'Delver Rook')
          ]
        }
      ],
      else: [
        say(['The altar is north. The crack is wider than it was this morning.', 'I am going to sit here and listen for a while.'], 'Delver Rook')
      ]
    }
  ],

  selene: [
    {
      if: { notFlag: 'mira_battle_done' },
      then: [say(['You are standing in a resonance field and you have nothing to shield you.', 'Go back. Please.'], 'Selene')],
      else: [
        {
          if: { notFlag: 'got_shard' },
          then: [
            say([
              'You felt it too. Good. Then I do not have to explain.',
              'My name is Selene. I have been tracking the Resonance since before you could read.',
              'The source is the old altar, north of the Whisperwood. Something is pressing through it.',
              'The altar is cracked. It has been cracked for a long time, and it is cracking faster.',
              'Go down. Listen. And bring back what is still singing.'
            ], 'Selene'),
            { set: { flag: 'selene_met', value: true } }
          ],
          else: [
            { if: { flag: 'chapter_complete' }, then: [
              say([
                'It closed. For now.',
                'Listen closely. The hum has changed pitch. It is not gone. It is waiting.',
                'Go east. Emberfall has a library, and the Archivist has been waiting for someone like you.'
              ], 'Selene')
            ], else: [
              say([
                'You have the shard. It is warm, yes? That is the door remembering it was a door.',
                'Rowan has fought a hundred Echoes and won. He will know what the hum means.',
                'The arena is south of Halvern Market. Win. Then bring me the answer.'
              ], 'Selene')
            ] }
          ]
        }
      ]
    }
  ],

  rowan: [
    {
      if: { notFlag: 'arena_ready' },
      then: [say(['The arena is not open to a stranger with a half-kept Echo.', 'Come back when the world has made sense of itself.'], 'Rowan')],
      else: [
        { if: { flag: 'chapter_complete' }, then: [
          say(['Well fought. Truly.', 'I have wanted to lose for a long time. It is a relief.', 'The Coiled Arena is yours to walk. The east gate is open.'], 'Rowan')
        ], else: [
          say([
            'Rowan. Nine years undefeated. You have heard that already, I expect.',
            'Then let us settle it in the only way that means anything here.',
            'One battle. Win, and the arena is yours to walk.'
          ], 'Rowan'),
          {
            battle: 'rowan',
            win: [
              { set: { flag: 'chapter_complete', value: true } },
              { set: { flag: 'gate_open', value: true } },
              { giveItem: 'elixir', qty: 2 },
              say([
                '...Yes. Yes, you have. Well played.',
                'The Resonance is not a monster. It is a door. And doors can be closed from both sides.',
                'The east gate is open. Go to Emberfall. The Archivist has been waiting for an answer.',
                'The Coiled Arena answers to you now.'
              ], 'Rowan'),
              { set: { flag: 'rowan_post', value: true } }
            ]
          }
        ] }
      ]
    }
  ],

  archivist: [
    {
      if: { notFlag: 'chapter_complete' },
      then: [say(['The library is closed to travellers until the hum quiets.', 'The east gate is locked for a reason.'], 'The Archivist')],
      else: [
        { if: { notFlag: 'ending_seen' }, then: [
          say([
            'So you are the one who closed the door.',
            'I have records going back four hundred years. The hum has never stopped. It has only waited.',
            'You did not kill it. You asked it to wait a little longer. That is the kindest thing anyone has done for it.',
            'Come. There is one more page to write.'
          ], 'The Archivist'),
          { ending: true }
        ], else: [
          say([
            'The page is written. The hum is quiet, and the sea keeps its own counsel.',
            'Asteria is yours to wander now. Every road you opened will remember you.'
          ], 'The Archivist')
        ] }
      ]
    }
  ],

  lumen_nurse: [
    say(['Welcome to the Lumen Rest House. Your Echoes look tired.', 'Shall I restore them?'], 'Nurse Alba'),
    { heal: true, respawn: { map: 'lumen_clinic', x: 6, y: 7 } },
    say(['All better. The beds are free if you need one.', 'Come back any time.'], 'Nurse Alba')
  ],

  halvern_nurse: [
    say(['Halvern Clinic. We patch up people and Echoes alike.', 'Hold still. This will only hum a little.'], 'Nurse Ione'),
    { heal: true, respawn: { map: 'halvern_clinic', x: 6, y: 7 } },
    say(['There. Good as new. The arena is south of the market — mind the gate.'], 'Nurse Ione')
  ],

  lumen_shopkeep: [
    say(['Salves, balls, and practical advice. The advice is free.', 'What will it be?'], 'Odile'),
    { shop: 'lumen' },
    say(['Come back when your pockets are lighter.'], 'Odile')
  ],

  halvern_shopkeep: [
    say(['Halvern Exchange. Everything you need, and one thing you do not.', 'Take your time.'], 'Tamsin'),
    { shop: 'halvern' },
    say(['A pleasure. Do not spend it all on balls.'], 'Tamsin')
  ],

  storage: [
    say(['The clinic keeps a storage terminal for travelling trainers.', 'Deposit or withdraw as you like.'], 'Clinic Clerk'),
    { storage: true }
  ],

  elder: [
    { if: { flag: 'chapter_complete' }, then: [
      say(['The sea kept its counsel, and so did you. That is rarer than you know.'], 'Elder Bram')
    ], else: [
      say([
        'The sea keeps its own counsel, young one. So does the forest.',
        'Vale has been measuring things again. I do not like the look on his face.',
        'Whatever hums under the water, it hums louder every season. Do not go looking alone.'
      ], 'Elder Bram')
    ] }
  ],

  pip: [
    say(['Are you really going to catch things? My brother says it is just noisy.', 'He says the tall grass is FULL of them. Loudly, even.'], 'Pip')
  ],

  tam: [
    say(['Do not go out on the rocks at dusk. The water is wrong lately.', 'Everything out there has changed. The fish, the birds. Even the light.'], 'Old Tam')
  ],

  bex: [
    say(['Rowan has not lost a match in nine years. NINE.', 'I am going to beat him someday. Probably.', 'You should go first, though. You look taller.'], 'Little Bex')
  ],

  tal: [
    say(['Balls, salves, and rumours. Rumours are free.', 'They say something old woke under the Whisperwood. I say do not go.', 'You are going anyway. Of course you are.'], 'Merchant Tal')
  ],

  delver: [
    say(['Mind the blue stone. It is colder than the rest, and it is listening.', 'Rook went deeper with a lantern. He has not come back for lunch.'], 'Delver Nell')
  ],

  altar: [
    {
      if: { notFlag: 'got_shard' },
      then: [
        say([
          'The altar is split clean through. A low note rises out of the crack.',
          'You reach in. Something warm and humming settles into your palm.',
          'RESONANCE SHARD obtained!'
        ]),
        { giveItem: 'resonance_shard', qty: 1 },
        { set: { flag: 'got_shard', value: true } },
        { set: { flag: 'ruins_found', value: true } },
        { set: { flag: 'arena_ready', value: true } },
        { sfx: 'item' },
        say([
          'The hum steadies. Somewhere above, a door that had been opening is now only ajar.',
          'Selene will want to see this. Rowan will want to know what it means.'
        ])
      ],
      else: [
        say(['The crack in the altar is quiet now. It still hums if you press your ear to it.'])
      ]
    }
  ],

  cave_note: [
    say(['A survey note, water-stained but legible:', '"The hum is not coming from the altar. It is coming from the space behind it."', '— S.'])
  ]
};

export const CHAPTER_END = [
  'The last Echo settles. The arena goes quiet, and under the floor you feel a single low note easing.',
  'The shard in your pocket stops humming. The crack in the altar has stopped widening.',
  'Selene was right. It was a door. Tonight, it is closed.',
  'Outside, the tide comes in over the flat stones of Lumen Bay, and the hum is gone.',
  'CHAPTER ONE COMPLETE — The Resonance Awakens'
];
