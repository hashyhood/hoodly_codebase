exports.up = function(knex) {
  return knex.schema
    .createTable('safety_alerts', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.enum('type', ['emergency', 'warning', 'info']).notNullable();
      table.string('title').notNullable();
      table.text('description').notNullable();
      table.jsonb('location').notNullable(); // {latitude, longitude, address}
      table.enum('severity', ['high', 'medium', 'low']).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.uuid('created_by').references('id').inTable('profiles').onDelete('CASCADE');
      table.integer('affected_area').defaultTo(1000); // radius in meters
      table.timestamps(true, true);
      
      // Indexes for performance
      table.index(['type', 'is_active']);
      table.index(['created_at']);
      table.index(['location'], 'gist'); // For spatial queries
    })
    
    .createTable('emergency_contacts', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('profiles').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('phone').notNullable();
      table.string('relationship');
      table.boolean('is_primary').defaultTo(false);
      table.timestamps(true, true);
      
      // Indexes
      table.index(['user_id']);
      table.index(['is_primary']);
    })
    
    .createTable('user_locations', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('profiles').onDelete('CASCADE');
      table.decimal('latitude', 10, 8).notNullable();
      table.decimal('longitude', 11, 8).notNullable();
      table.string('address');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes for location queries
      table.index(['user_id']);
      table.index(['updated_at']);
      table.index(['latitude', 'longitude']);
      
      // Ensure one location per user
      table.unique(['user_id']);
    })
    
    .createTable('alert_responses', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('alert_id').references('id').inTable('safety_alerts').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('profiles').onDelete('CASCADE');
      table.enum('response_type', ['confirm', 'deny', 'help_offered']).notNullable();
      table.text('comment');
      table.timestamps(true, true);
      
      // Indexes
      table.index(['alert_id']);
      table.index(['user_id']);
      table.index(['response_type']);
      
      // Prevent duplicate responses
      table.unique(['alert_id', 'user_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('alert_responses')
    .dropTableIfExists('user_locations')
    .dropTableIfExists('emergency_contacts')
    .dropTableIfExists('safety_alerts');
}; 