// ========================================
// WhatsApp Clone - Production Level Schema
// For dbdiagram.io
// ========================================

Table users {
  id uuid [primary key, default: `gen_random_uuid()`]

  phone varchar [unique, not null]
  username varchar
  bio varchar
  profile_pic varchar

  is_online boolean [default: false]
  last_seen timestamp

  is_deleted boolean [default: false]
  deleted_at timestamp

  created_at timestamp
  updated_at timestamp

  indexes {
    phone
  }
}


// ========================================
// User Contacts
// ========================================

Table contacts {
  id uuid [primary key, default: `gen_random_uuid()`]

  user_id uuid [ref: > users.id, note: "Owner of contact list"]
  contact_id uuid [ref: > users.id, note: "Actual contact user"]

  saved_name varchar

  created_at timestamp
  updated_at timestamp

  indexes {
    (user_id, contact_id) [unique]
  }
}


// ========================================
// Chats
// ========================================

Table chats {
  id uuid [primary key, default: `gen_random_uuid()`]

  is_group boolean [default: false]

  group_name varchar
  group_picture varchar
  group_description text

  created_by uuid [ref: > users.id]

  last_message_id uuid
  last_message_at timestamp

  created_at timestamp
  updated_at timestamp

  indexes {
    last_message_at
  }
}


// ========================================
// Chat Participants
// ========================================

Table chat_participants {
  chat_id uuid [ref: > chats.id]
  user_id uuid [ref: > users.id]

  role varchar [default: 'member', note: 'member, admin, super_admin']

  is_muted boolean [default: false]
  joined_at timestamp

  indexes {
    (chat_id, user_id) [pk]
  }
}


// ========================================
// Messages
// ========================================

Table messages {
  id uuid [primary key, default: `gen_random_uuid()`]

  chat_id uuid [ref: > chats.id]
  sender_id uuid [ref: > users.id]

  content text

  media_url varchar
  thumbnail_url varchar

  file_size integer
  duration integer

  message_type varchar [
    default: 'text',
    note: 'text, image, video, document, audio'
  ]

  reply_to_message_id uuid [ref: > messages.id]

  is_edited boolean [default: false]
  edited_at timestamp

  is_deleted boolean [default: false]
  deleted_at timestamp

  created_at timestamp
  updated_at timestamp

  indexes {
    chat_id
    sender_id
    created_at
  }
}


// ========================================
// Message Delivery / Read Status
// ========================================

Table message_status {
  message_id uuid [ref: > messages.id]
  user_id uuid [ref: > users.id]

  status varchar [
    default: 'sent',
    note: 'sent, delivered, read'
  ]

  updated_at timestamp

  indexes {
    (message_id, user_id) [pk]
  }
}


// ========================================
// Stories / Status
// ========================================

Table statuses {
  id uuid [primary key, default: `gen_random_uuid()`]

  user_id uuid [ref: > users.id]

  media_url varchar
  thumbnail_url varchar

  content text

  expires_at timestamp

  created_at timestamp
  updated_at timestamp

  indexes {
    user_id
    expires_at
  }
}


// ========================================
// Status Views
// ========================================

Table status_views {
  status_id uuid [ref: > statuses.id]
  viewer_id uuid [ref: > users.id]

  viewed_at timestamp

  indexes {
    (status_id, viewer_id) [pk]
  }
}


// ========================================
// Calls
// ========================================

Table calls {
  id uuid [primary key, default: `gen_random_uuid()`]

  caller_id uuid [ref: > users.id]
  receiver_id uuid [ref: > users.id]

  call_type varchar [note: 'audio, video']

  status varchar [
    note: 'initiated, ongoing, completed, missed, rejected'
  ]

  started_at timestamp
  ended_at timestamp

  created_at timestamp
}


// ========================================
// Group Call Participants
// ========================================

Table call_participants {
  call_id uuid [ref: > calls.id]
  user_id uuid [ref: > users.id]

  joined_at timestamp
  left_at timestamp

  indexes {
    (call_id, user_id) [pk]
  }
}