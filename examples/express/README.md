# Skybolt Server (Node.js + Express)

Skybolt is a high performance front end asset loading and caching library which jumps through significant hoops to make sure your assets are loaded as fast as possible, and always with a Lighthouse / Page Speed score of 100.

In a nutshell, the Skybolt Server component will detect if a client is 'cold' and automatically inline all assets into the HTML, eliminating additional HTTP requests. The Skybolt Client component will take these inlined assets, store them in localStorage, and then serve them from there on subsequent requests.

## Requirements

- Node.js 14+
- Yarn

## Local development

Install dependencies:

```sh
yarn install
```

Run development server:

```sh
yarn dev
```

Open <http://localhost:3000> in your browser.

Now take a look at the source to see how the HTML is being served, and how the assets are being inlined
