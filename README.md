# Next.js & HeroUI Template

This is a template for creating applications using Next.js 14 (app directory) and HeroUI (v2).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/heroui/next-app-template)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Use the template with create-next-app

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/heroui-inc/next-app-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).

# ThirdSpace 🌐

**ThirdSpace** is a next-generation social planning app designed to help real people make real plans in real life — no pressure, no noise, just a space to be you.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Frontend**: [React 18](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [HeroUI](https://heroui.dev/) + custom animations
- **Backend**: Node.js / Express-like API routes
- **Database**: MongoDB (via native driver)
- **Auth**: Custom + OAuth social logins (Google, GitHub, more coming soon)

---

## 🔧 Local Development Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-username/thirdspace.git
   cd thirdspace

   ```

2. **Create env.local**
   MONGO_URI=<your-mongo-connection-string>
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

3. **Run the dev server**

npm run dev

**📁 Folder Structure (Highlights)**

├── app/
│ ├── login/ → Login UI
│ ├── register/ → Multi-step registration form
│ ├── providers/ → Custom Toast + Theme providers
├── components/
│ ├── register-forms/ → Step components (Name, Email, etc.)
│ ├── navigation/ → Floating buttons
│ ├── background-animations/
├── utils/
│ ├── frontend-backend-connection/
│ └── handleRegisterUser.ts
├── lib/
│ └── mongodb.ts → MongoDB client setup

## 🧪 Coming Soon

- 🎊 Post-registration "Thank You" page with confetti

- 📆 User event feed with smart planning suggestions

- 📲 Native mobile build (React Native or Expo)

- 🧙 AI social assistant ("What should we do this weekend?")

## 🧠 Philosophy

    ThirdSpace isn't just another event app. It's the antidote to flaky plans, endless group chats, and social burnout. Think: what Facebook events were supposed to be... but cooler.
