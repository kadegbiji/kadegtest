# Building a CI/CD Pipeline

By the end of this session, you'll have a working CI/CD pipeline that automatically tests your code, packages it into a Docker image, and deploys it to a live URL — every time you push a change. Not a diagram of a pipeline or a hypothetical walkthrough: a real, running pipeline that you built yourself.

Along the way, you'll encounter the problems that CI/CD was invented to solve, and understand why the industry converged on these solutions. You'll also define your environment as code — the foundational idea behind Infrastructure as Code (IaC).

---

## What You'll Need

- A GitHub account (free) — sign up at [github.com](https://github.com)
- A web browser (no software installation required for the core exercise)
- Docker Desktop installed locally — for the Infrastructure as Code extension

---

## What You'll Learn

- Why manual testing and deployment break down at scale — and how automation solves it
- The three phases of a CI/CD pipeline: integration, delivery, and deployment
- Writing GitHub Actions workflows — the industry-standard way to define pipelines as code
- How Docker containers make builds consistent and repeatable
- How Infrastructure as Code lets you define, version, and reproduce environments

---

## The Codebase: What You're Starting With

This repository contains a simple web application — a text analysis tool that counts words, characters, and estimates reading time. It's deliberately simple so that it doesn't get in the way of what you're actually learning, which is the pipeline around it.

Before you build any automation, take a few minutes to understand what you're working with:

```
/
├── src/
│   └── textUtils.js        ← The application logic: three utility functions
├── tests/
│   └── textUtils.test.js   ← Automated tests for those functions
├── index.html              ← The web interface
├── package.json            ← Project configuration and dependencies
├── .eslintrc.json          ← Linting rules
├── Dockerfile              ← How to package this app as a container
├── docker-compose.yml      ← Infrastructure as Code (you'll explore this later)
└── .github/
    └── workflows/          ← Empty for now — you'll create the pipeline here
```

Open `src/textUtils.js` and read through the three functions. Open `tests/textUtils.test.js` and match each test to the function it covers. Understanding what's being tested — and why — is essential before you automate the testing.

> **Reflection:** What kinds of mistakes could a developer make in these functions that would still *look* correct in a code review, but would break in real use? The answer to that question is what automated tests are for.

---

## Step 1: Fork the Repository

Before you can make changes or build a pipeline, you need your own copy of this repository.

**The problem this solves:** You can't push changes to a repository you don't own. More importantly, your pipeline should run in *your* account, so you own the output — the deployed site, the container images, the workflow runs.

1. Make sure you're signed in to GitHub
2. Click the **"Use this template"** button at the top of this page
3. Choose **"Create a new repository"**
4. Give your repository a name (e.g., `cicd-pipeline`)
5. Make sure **Public** is selected — GitHub Pages and GitHub Container Registry require this on the free tier
6. Click **"Create repository"**

You now have a completely independent copy. Changes you make won't affect the original, and future updates to the template won't affect yours. This isolation — each developer working in their own copy — is the foundation of how professional teams use Git.

---

## Step 2: Enable GitHub Pages

Your deployment target needs to exist before your pipeline can deploy to it. GitHub Pages is a free hosting service that serves static websites directly from a GitHub repository. It will be the live environment your pipeline deploys to.

1. In your new repository, click **Settings**
2. In the left sidebar, click **Pages**
3. Under **Source**, select **GitHub Actions** — this tells GitHub Pages to accept deployments from your workflow, rather than directly from a branch

That's it for now. There's nothing live yet — that comes when your pipeline runs for the first time.

---

## Step 3: Your First Pipeline Stage — Continuous Integration

### The Problem

Here's a situation that will be familiar to anyone who has worked on a team project:

A developer makes a change to a shared codebase. The change looks fine. It passes a quick visual check. It gets merged. Two days later, someone else is debugging a completely unrelated feature and discovers that something stopped working — and has to trace back through the commit history to find out why.

This is the problem of **broken integration**: individual changes that look correct in isolation can conflict with or break other parts of the system. The later you discover a breakage, the more expensive it is to fix. The cost isn't just the time to debug — it's the interruption to other developers, the potential for those developers to build further work on top of a broken foundation, and the damage to trust in the codebase.

### The Solution: Continuous Integration

**Continuous Integration (CI)** means that every time anyone pushes code, an automated process immediately runs against it: linting the code for style violations and potential errors, executing the test suite, and reporting the result. If any check fails, the build is marked as broken and the team knows immediately — before anyone else has built on top of the change.

The key word is *continuous*: not "we run tests before releases" or "developers run tests when they remember to", but every single push, automatically, within minutes.

### GitHub Actions

GitHub Actions is GitHub's built-in automation platform. You define pipelines — called **workflows** — as YAML files stored in the `.github/workflows/` directory of your repository. Because they live alongside your code, they're version-controlled, reviewable, and auditable. You can see exactly what changed in the pipeline, when, and why — the same as any other file.

A workflow consists of one or more **jobs**, each containing a sequence of **steps**. Steps can run shell commands or call pre-built **actions** — reusable units of automation published by GitHub and the community. The `uses:` keyword invokes an action; the `run:` keyword executes a shell command directly.

### Create Your CI Workflow

1. In your repository, click **"Add file"** → **"Create new file"**
2. In the filename field, type: `.github/workflows/pipeline.yml`

   > The `.github/workflows/` path is where GitHub looks for workflow definitions. The filename can be anything, but it must end in `.yml` or `.yaml`.

3. Paste in the following workflow:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: ['**']
  pull_request:

jobs:
  # ── Stage 1: Continuous Integration ────────────────────────────────────────
  test:
    name: Lint and Test
    runs-on: ubuntu-latest

    steps:
      - name: Check out the code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test
```

4. Scroll down and click **"Commit changes"**, then commit directly to `main`

### What Just Happened?

Navigate to the **Actions** tab in your repository. You should see a workflow run in progress — or already complete. Click on it to explore the detail: you can see each step, its output, how long it took, and whether it passed.

The `on:` block defines the **trigger**: this workflow runs on any push to any branch (`'**'` is a wildcard), and on pull requests. Every future push to this repository will automatically trigger a run.

The `runs-on: ubuntu-latest` line provisions a fresh virtual machine for each run. This is important: every run starts from a clean, identical environment. There's no "it worked on my machine" — the machine is always the same machine.

> **Notice:** The `npm ci` command is used instead of `npm install`. `ci` stands for "clean install" — it installs *exactly* the versions specified in `package-lock.json`, rather than resolving the latest compatible versions. This makes your CI environment reproducible.

---

## Step 4: Break the Build (on Purpose)

A passing pipeline is satisfying. But a *failing* pipeline is where CI earns its value.

You're going to introduce a deliberate bug and watch the pipeline catch it.

1. Open `src/textUtils.js` in the editor
2. Find the `wordCount` function. Change the logic so it returns an incorrect value — for example, change `return words.length` to `return words.length + 1`
3. Commit the change to `main`
4. Go to the **Actions** tab and watch the run

The pipeline will fail. The **Run tests** step will show red. Click into it and you'll see the test output: which test failed, what value it received, and what value it expected.

Now notice what *hasn't* happened: no one else's work is broken. The broken code is in your repository, on your branch. No one has deployed it anywhere. No one else built on top of it. The pipeline stopped it.

**Fix the bug** — revert your change to `textUtils.js` and commit again. Watch the pipeline go green.

> **Reflection:** On a team of ten developers, all pushing changes throughout the day, how often would you expect the build to break? Who is responsible for fixing it? What does a broken build mean for everyone else? These aren't rhetorical questions — they're things professional teams have established norms and agreements about.

---

## Step 5: Package Your Application — Continuous Delivery

### The Problem

Your tests pass. The code is correct. Now someone needs to actually *run* it somewhere.

The traditional approach: write a document explaining how to set up the server, which versions of which software it needs, what environment variables to configure, and which steps to run in which order. The person doing the deployment follows the document — and it doesn't quite work, because the document was written for an older version of the OS, or assumes a tool is already installed, or omits a step that the author considered obvious.

This is called **configuration drift**: the gap between the documented environment and the actual environment, which widens over time as both the documentation and the environment evolve independently. It's one of the most persistent sources of deployment failures.

### The Solution: Containers

A **container** is a self-contained, executable package that includes not just your application code, but everything it needs to run: the runtime, the libraries, the configuration. The environment is defined once, packaged once, and runs identically everywhere it's deployed — on your laptop, on a test server, in production.

**Docker** is the dominant containerisation platform. A `Dockerfile` is a set of instructions for building a container image. Look at the `Dockerfile` in this repository:

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

This is a complete environment definition: start from an official Nginx web server image (a lightweight Linux environment with Nginx pre-installed), copy the application files into the directory Nginx serves, and declare that the container listens on port 80. That's all it takes to package this application.

**Continuous Delivery** means that every time the integration stage passes, the application is automatically packaged and made available for deployment — as a tested, versioned artifact that can be deployed to any environment at any time.

### Add a Delivery Stage

The delivery stage should only run when changes land on the `main` branch — not on every push to every branch. You don't want to publish a new container image for every work-in-progress commit on a feature branch; you want to publish when code has been reviewed and merged.

You'll push the image to the **GitHub Container Registry (GHCR)** — GitHub's built-in container image registry, free for public repositories. The `GITHUB_TOKEN` is an automatically-provided secret that grants the workflow permission to push to your registry without any manual credential setup.

Add the following job to your `pipeline.yml`, after the `test` job. Make sure the indentation matches — in YAML, indentation defines structure.

```yaml
  # ── Stage 2: Continuous Delivery ───────────────────────────────────────────
  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write

    steps:
      - name: Check out the code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}
```

Commit this change and go to the **Actions** tab. You'll see both jobs in the workflow: `test` runs first, and `build-and-push` only starts once `test` completes successfully.

### Understanding the Tags

The image is published with two tags: `latest` (always pointing to the most recent successful build) and the full Git commit SHA (a unique fingerprint of the exact code that produced this image). The SHA tag is what makes deployments reproducible — if something goes wrong in production, you can identify the exact commit that built the running image, and roll back to a previous SHA with confidence.

After the workflow completes, click **Packages** on your GitHub profile to see your published image listed in the registry.

> **Notice:** `needs: test` creates an explicit dependency between jobs. `build-and-push` will only run if `test` succeeds. This is how pipelines enforce sequential stages — later stages are gated on earlier ones passing.

---

## Step 6: Ship to Production — Continuous Deployment

### The Problem

You now have a tested, packaged artifact sitting in a registry. It still isn't live. Someone needs to take that artifact and deploy it — and in most organisations, that involves a manual process: raising a ticket, waiting for a deployment window, logging into a server, running commands, verifying the result.

Manual deployment has two compounding problems. First, it's slow: the gap between code being ready and code being in front of users is measured in days or weeks, not minutes. Second, it's inconsistent: manual steps, performed by different people at different times, introduce variation. The environment you're deploying to may have drifted from the last time someone deployed to it.

### The Solution: Continuous Deployment

**Continuous Deployment** closes the loop: once the delivery stage produces a verified artifact, the deployment stage automatically ships it. Every change that passes CI goes to production — automatically, consistently, with no human intervention in the process itself.

This might sound alarming if you're used to thinking of deployment as a high-stakes, careful activity. But the insight behind CD is that frequent, small deployments are *safer* than infrequent, large ones. A deployment of one change is easy to reason about and easy to roll back. A deployment of three months' worth of accumulated changes is a risk event.

### Add a Deployment Stage

For this application, the deployment target is GitHub Pages. The `actions/deploy-pages` action handles the deployment; all you need to do is tell it what to upload.

Add this final job to your `pipeline.yml`:

```yaml
  # ── Stage 3: Continuous Deployment ─────────────────────────────────────────
  deploy:
    name: Deploy to GitHub Pages
    runs-on: ubuntu-latest
    needs: build-and-push

    permissions:
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Check out the code
        uses: actions/checkout@v4

      - name: Set up Pages
        uses: actions/configure-pages@v4

      - name: Upload site files
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Commit and watch the workflow run all three stages in sequence. When it completes, navigate to:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME
```

Your application is live. It was deployed automatically, from a commit you just made, via a pipeline that tested and packaged it first.

Make a visible change to `index.html` — update the title, change some text — and commit it. Watch the pipeline run. Within a few minutes, your change is live at the same URL.

**That is a CI/CD pipeline.** From this point on, any change that passes your tests is automatically delivered to the world.

### The Environment Block

Notice the `environment:` block in the deploy job. This registers the deployment with GitHub's **Environments** feature — click **Deployments** on your repository's main page to see it. Environments give you a record of every deployment: what was deployed, when, by which workflow run, and a direct link to the live site. In professional settings, environments can also have **protection rules** — requiring a manual approval before deployment proceeds, or restricting which branches can deploy to production.

> **Reflection:** If every commit that passes CI is automatically deployed to production, what does that imply about the quality of your tests? What's the relationship between CI/CD and test coverage? What happens if your tests don't catch a bug — and that bug goes straight to production?

---

## Step 7: Infrastructure as Code

### The Problem

You've now defined your pipeline as code — the `pipeline.yml` file describes exactly what runs, in what order, under what conditions. That file is version-controlled: you can see its history, compare versions, review changes, and roll back if something breaks.

But what about the environment your application actually *runs* in? In most traditional setups, that environment — the server configuration, the software versions, the network settings — exists only in the minds of the people who set it up, or in documents that have drifted out of date. If the server is lost, recreating it from memory or documentation takes days and introduces errors. If you want to spin up a second environment (for testing, or for a different region), you're repeating the same manual process.

### The Solution: Infrastructure as Code

**Infrastructure as Code (IaC)** applies the same principle to environments that version control applies to software: define the infrastructure in text files, store those files in Git, and use tooling to apply them consistently. The environment becomes reproducible — you can destroy it and recreate it identically from the files, spin up multiple copies, and track every change that was ever made to it.

Open `docker-compose.yml` in this repository:

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - .:/usr/share/nginx/html

  test-runner:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - .:/app
    command: npm test
```

This file defines two services as code. `web` builds the application from the local `Dockerfile` and runs it, mapping port 8080 on your machine to port 80 in the container. `test-runner` spins up a Node.js environment and executes the test suite. Both services share the same codebase via a volume mount.

If you have Docker Desktop installed, try it:

```bash
# Start the application locally
docker compose up web

# Visit http://localhost:8080 in your browser

# In a separate terminal, run the tests inside a container
docker compose run test-runner

# Stop everything
docker compose down
```

Your local environment is now described entirely by two text files: `Dockerfile` and `docker-compose.yml`. Anyone who clones this repository and has Docker installed can run this application in seconds, in an environment that matches everyone else's exactly.

### Why This Matters at Scale

Docker Compose is a tool for local development and simple multi-container applications. Production IaC tools — **Terraform**, **Ansible**, **AWS CloudFormation**, **Pulumi** — operate at a larger scale: provisioning cloud infrastructure (virtual machines, databases, load balancers, networking), managing hundreds of servers, and orchestrating complex environments across multiple cloud providers.

The underlying principle is the same. The environment is a text file. The text file is in Git. Changes to the environment go through the same review process as changes to the application. The difference between what you intended to provision and what is actually running can be detected and reconciled automatically.

> **Reflection:** In the docker-compose.yml above, both the application and the test runner are defined in the same file. In a professional environment, you'd typically have separate compose files for development, testing, and production configurations. Why? What would change between environments, and what would stay the same?

---

## Bringing It Together: The Complete Pipeline

Your final `pipeline.yml` defines all three stages of the CI/CD pipeline. Here's how they relate:

| Stage | Job | Trigger | What it does | Why it matters |
|---|---|---|---|---|
| **Integration** | `test` | Every push | Lints code, runs tests | Catches bugs immediately, before they spread |
| **Delivery** | `build-and-push` | Push to `main` (only if tests pass) | Builds a Docker image, pushes to registry | Produces a consistent, versioned artifact ready to deploy |
| **Deployment** | `deploy` | After delivery succeeds | Ships the artifact to GitHub Pages | Closes the loop: tested code reaches users automatically |

Each stage gates the next. A test failure blocks delivery. A delivery failure blocks deployment. Nothing reaches production unless it has passed every previous stage — and every stage is defined as code, auditable, and reproducible.

---

## What Next?

You've built a working CI/CD pipeline from first principles. Here's where each concept you've encountered leads:

| What you did | The concept | Where it leads |
|---|---|---|
| Wrote a GitHub Actions workflow | Pipeline as code | Jenkins, CircleCI, GitLab CI, Azure DevOps |
| Gated stages with `needs:` | Build dependencies | Parallel pipelines, fan-in/fan-out patterns |
| Pushed to GitHub Container Registry | Artefact management | Private registries, image scanning, signing |
| Deployed to GitHub Pages | Continuous deployment | Cloud platforms (AWS, Azure, GCP), Kubernetes |
| Defined a service in Docker Compose | Infrastructure as Code | Terraform, Ansible, AWS CloudFormation |
| Tagged images with commit SHAs | Immutable artefacts | Deployment rollbacks, audit trails |

**Explore environments and protection rules** — in your repository's Settings, add a protection rule to the `github-pages` environment that requires a manual approval before deployment proceeds. Watch how this changes the workflow run behaviour. This is how organisations implement change control within a CD pipeline without abandoning automation.

**Add a quality gate** — modify the `test` job to generate a test coverage report and fail if coverage drops below a threshold. This is how teams enforce that new code must be accompanied by new tests.

**Explore Terraform** — the [Terraform Getting Started guide](https://developer.hashicorp.com/terraform/tutorials) walks through provisioning real cloud infrastructure (a virtual machine, a network, a storage bucket) using the same IaC principles you've seen in Docker Compose, applied at cloud scale.

---

## Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions) — pre-built actions for common tasks
- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose Reference](https://docs.docker.com/compose/reference/)
- [Terraform Getting Started](https://developer.hashicorp.com/terraform/tutorials)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [The Twelve-Factor App](https://12factor.net/) — influential methodology for building software that deploys reliably
