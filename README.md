# PT3Labs_Contractor_BE
Back End


# API URL
https://fierce-plains-47590.herokuapp.com

# Schema

### Contractors

| field | data type        | metadata |
| ----- | ---------------- | -------- |
| id | UUID | primary key. generated by database |
| name  | text | required |
| phone_number | text | required, unique |
| street_address | text | required |
| city | text | required |
| state_abbr | text | required. Char Limit 2 |
| zip_code | text | required. Char Limit 10 |
| created_at | timestamp | generated by database |


### Schedules

| field | data type        | metadata |
| ----- | ---------------- | -------- |
| contractor_id | foreign key | Contractors(id) |
| start_time | timestamp | required |
| duration | interval | required |
| created_at | timestamp | generated by database |


### Users

| field | data type        | metadata |
| ----- | ---------------- | -------- |
| id | UUID | primary key. generated by database |
| google_id | text | required |
| username | text | required. unique |
| phone_number | text | required. unique |
| email | text | required. unique |
| contractor_id | foreign key | Contractors(id) |
| created_at | timestamp | generated by database |


### Services

| field | data type        | metadata |
| ----- | ---------------- | -------- |
| id | UUID | primary key. generated by database |
| name | text | required |
| price | money | defaults to null |
| contractor_id | foreign key | Contractors(id) |
| created_at | timestamp | generated by database |


### Appointments

| field | data type        | metadata |
| ----- | ---------------- | -------- |
| id | UUID | primary key. generated by database |
| user_id | foreign key | Users(id) |
| contractor_id | foreign key | Contractors(id) |
| service_id | foreign key | Services(id) |
| appointment_datetime | timestamp | required |
| duration | interval | required |
| created_at | timestamp | generated by database |


### Feedback

| field | data type        | metadata |
| ----- | ---------------- | -------- |
| id | UUID | primary key. generated by database |
| user_id | foreign key | Users(id) |
| contractor_id | foreign key | Contractors(id) |
| stars | integer | required |
| message | text | required |
| created_at | timestamp | generated by database |
