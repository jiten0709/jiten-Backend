
# Fullstack

How to connect frontend and backend in javascript | Fullstack Proxy and CORS.

## Backend 
- Step 1: ``` npm init ``` and keep main as 'server.js' & install dependencies.

- Step 2: in package.json change under 'scripts', change ``` "test": "xyz" ``` to ``` "start": "node server.js" ```.

- Step 3: in package.json, add ``` "type": "module" ```.

- Step 4: After moving ``` dist ``` folder in root of Backend, run ``` npm start ``` and your application will successfully run.

## Frontend 

- Step 1: ``` npm run build ``` and then move the ``` dist ``` folder generated to our ``` Backend ``` folder.

- Step 2: Then follow ``` Step 4 ``` of Backend section.