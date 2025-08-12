exports.seed = function(knex) {
  return knex('rooms').del()
    .then(function () {
      return knex('rooms').insert([
        {
          name: 'Hot Takes',
          emoji: '🔥',
          description: 'Share your hottest takes and controversial opinions',
          is_public: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Heartbreak Hotel',
          emoji: '💔',
          description: 'A safe space for the brokenhearted',
          is_public: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Brain Trust',
          emoji: '🧠',
          description: 'Deep conversations and intellectual discussions',
          is_public: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Cool Kids',
          emoji: '😎',
          description: 'Just vibing and being cool',
          is_public: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Gym Bros',
          emoji: '💪',
          description: 'Fitness, motivation, and gains',
          is_public: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    });
}; 