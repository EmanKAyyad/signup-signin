**Sign Up/ Sign In application**

this is an application that uses Nestjs/Mongodb/TypeOrm on the backend, and React on the frontend.
authentication is implemented using JWT.
it's a simple app with a signup form, login form and dashboard with a logout button.
simple CI is implemented using Docker and Nginx
all you need is .env file in the root dir with the following variables:
`PORT=`
`DB_URL=`
`JWT_SECRET`

to run the project locally all you need is to run `npm i` in root dir and also in client dir.
run `npm run start` from the root directory to concurrently run both projects

backend in on port 4000, frontend in on port 5173.

to run the project using Docker and Nginx just run `docker-compose up --build` from the root dir to build both images and run the containers using docker-compose.yml file.

Swagger impmenetation is deployed on `localhost:4000/api` for `/authenticate` and `/sign-up`
