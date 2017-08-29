'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql("CREATE TYPE os_enum AS ENUM ('ios', 'android')")
    .then( (res)=> {
      return db.createTable("device_tokens", {
	uuid: { type: "uuid",
		primaryKey: true,
		defaultValue: new String('uuid_generate_v4()')
	      },
	
	os: { type: "os_enum",
	      notNull: true,
	    },
	
	token: { type: "text",
		 nonNull: true
	       }
      });
    });
};

exports.down = function(db) {
  return db.dropTable("device_tokens")
    .then( (result)=> {
      return db.runSql("DROP TYPE os_enum");
    });
};

exports._meta = {
  "version": 1
};
