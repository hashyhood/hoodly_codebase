exports.up = function(knex) {
  return knex.schema
    // Users table
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username', 30).unique().notNullable();
      table.string('email', 255).unique().notNullable();
      table.string('password', 255).notNullable();
      table.string('phone', 20);
      table.text('bio');
      table.string('avatar_url');
      table.string('role', 20).defaultTo('user');
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_online').defaultTo(false);
      table.boolean('is_verified').defaultTo(false);
      table.timestamp('last_seen');
      table.decimal('current_latitude', 10, 8);
      table.decimal('current_longitude', 11, 8);
      table.string('current_city', 100);
      table.jsonb('preferences').defaultTo('{}');
      table.timestamps(true, true);
      
      table.index(['username']);
      table.index(['email']);
      table.index(['is_online']);
      table.index(['current_city']);
    })

    // User locations history
    .createTable('user_locations', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.decimal('latitude', 10, 8).notNullable();
      table.decimal('longitude', 11, 8).notNullable();
      table.string('city', 100).notNullable();
      table.string('country', 100).notNullable();
      table.string('neighborhood', 100);
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['city']);
      table.index(['country']);
      table.index(['created_at']);
    })

    // Posts table
    .createTable('posts', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('content').notNullable();
      table.string('emoji', 10);
      table.jsonb('media').defaultTo('[]'); // Array of media URLs
      table.decimal('latitude', 10, 8);
      table.decimal('longitude', 11, 8);
      table.string('city', 100);
      table.string('neighborhood', 100);
      table.boolean('is_public').defaultTo(true);
      table.boolean('is_anonymous').defaultTo(false);
      table.integer('view_count').defaultTo(0);
      table.integer('share_count').defaultTo(0);
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['city']);
      table.index(['created_at']);
      table.index(['latitude', 'longitude']);
    })

    // Post reactions
    .createTable('post_reactions', (table) => {
      table.increments('id').primary();
      table.integer('post_id').references('id').inTable('posts').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('reaction', 10).notNullable(); // emoji
      table.timestamps(true, true);
      
      table.unique(['post_id', 'user_id', 'reaction']);
      table.index(['post_id']);
      table.index(['user_id']);
    })

    // Comments on posts
    .createTable('comments', (table) => {
      table.increments('id').primary();
      table.integer('post_id').references('id').inTable('posts').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('parent_id').references('id').inTable('comments').onDelete('CASCADE');
      table.text('content').notNullable();
      table.string('emoji', 10);
      table.timestamps(true, true);
      
      table.index(['post_id']);
      table.index(['user_id']);
      table.index(['parent_id']);
    })

    // Rooms table
    .createTable('rooms', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.text('description');
      table.string('emoji', 10);
      table.string('city', 100).notNullable();
      table.string('neighborhood', 100);
      table.string('category', 50);
      table.boolean('is_public').defaultTo(true);
      table.boolean('is_active').defaultTo(true);
      table.integer('max_members').defaultTo(1000);
      table.integer('current_members').defaultTo(0);
      table.string('last_message');
      table.timestamp('last_message_at');
      table.jsonb('rules').defaultTo('[]');
      table.timestamps(true, true);
      
      table.index(['city']);
      table.index(['neighborhood']);
      table.index(['is_active']);
      table.index(['current_members']);
    })

    // Room members
    .createTable('room_members', (table) => {
      table.increments('id').primary();
      table.integer('room_id').references('id').inTable('rooms').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('role', 20).defaultTo('member'); // member, moderator, admin
      table.boolean('is_active').defaultTo(true);
      table.timestamp('joined_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);
      
      table.unique(['room_id', 'user_id']);
      table.index(['room_id']);
      table.index(['user_id']);
    })

    // Messages in rooms
    .createTable('messages', (table) => {
      table.increments('id').primary();
      table.integer('room_id').references('id').inTable('rooms').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('content').notNullable();
      table.string('emoji', 10);
      table.jsonb('media').defaultTo('[]');
      table.boolean('is_edited').defaultTo(false);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      
      table.index(['room_id']);
      table.index(['user_id']);
      table.index(['created_at']);
    })

    // Message reactions
    .createTable('message_reactions', (table) => {
      table.increments('id').primary();
      table.integer('message_id').references('id').inTable('messages').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('reaction', 10).notNullable();
      table.timestamps(true, true);
      
      table.unique(['message_id', 'user_id', 'reaction']);
      table.index(['message_id']);
      table.index(['user_id']);
    })

    // User relationships (followers, friends)
    .createTable('user_relationships', (table) => {
      table.increments('id').primary();
      table.integer('follower_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('following_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('status', 20).defaultTo('following'); // following, blocked, muted
      table.timestamps(true, true);
      
      table.unique(['follower_id', 'following_id']);
      table.index(['follower_id']);
      table.index(['following_id']);
    })

    // Events table
    .createTable('events', (table) => {
      table.increments('id').primary();
      table.integer('creator_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('title', 200).notNullable();
      table.text('description');
      table.string('emoji', 10);
      table.timestamp('start_time').notNullable();
      table.timestamp('end_time');
      table.decimal('latitude', 10, 8);
      table.decimal('longitude', 11, 8);
      table.string('address');
      table.string('city', 100);
      table.string('category', 50);
      table.boolean('is_public').defaultTo(true);
      table.integer('max_attendees');
      table.integer('current_attendees').defaultTo(0);
      table.timestamps(true, true);
      
      table.index(['creator_id']);
      table.index(['city']);
      table.index(['start_time']);
      table.index(['category']);
    })

    // Event attendees
    .createTable('event_attendees', (table) => {
      table.increments('id').primary();
      table.integer('event_id').references('id').inTable('events').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('status', 20).defaultTo('going'); // going, maybe, not_going
      table.timestamps(true, true);
      
      table.unique(['event_id', 'user_id']);
      table.index(['event_id']);
      table.index(['user_id']);
    })

    // Notifications table
    .createTable('notifications', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('type', 50).notNullable(); // post_like, comment, message, event, etc.
      table.integer('sender_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('target_id'); // ID of the target object (post, message, etc.)
      table.string('target_type', 50); // post, message, event, etc.
      table.text('message').notNullable();
      table.jsonb('data').defaultTo('{}');
      table.boolean('is_read').defaultTo(false);
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['is_read']);
      table.index(['created_at']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('event_attendees')
    .dropTableIfExists('events')
    .dropTableIfExists('user_relationships')
    .dropTableIfExists('message_reactions')
    .dropTableIfExists('messages')
    .dropTableIfExists('room_members')
    .dropTableIfExists('rooms')
    .dropTableIfExists('comments')
    .dropTableIfExists('post_reactions')
    .dropTableIfExists('posts')
    .dropTableIfExists('user_locations')
    .dropTableIfExists('users');
}; 