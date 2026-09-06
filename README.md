# Vin Tracker

Build a beautiful mobile-first productivity application called Vin Tracker.

APP PURPOSE

Vin Tracker is a simple personal task and progress tracking app.

The core idea is:

Plan your tasks → Complete your tasks → Track your progress.

Keep it simple. Do not turn it into a complicated project management or social media application.

The app should feel polished, premium, fast, clean, and easy to use on a mobile phone.

BRAND

Name: Vin Tracker

Tagline:

Track your tasks. Build consistency.

Use the provided Vin Tracker logo as the application branding where appropriate.

The visual identity should use a premium blue/indigo color system with white backgrounds and clean dark text.

Also support a beautiful dark mode.

TECHNOLOGY

Build the application using a modern React + TypeScript architecture.

Use Tailwind CSS for styling.

Use Supabase for persistent data storage.

The architecture must be clean and maintainable.

Make the application responsive, but prioritize Android/mobile screens.

Structure the project so it can later be packaged into an Android APK using Capacitor or another suitable Android wrapper.

Also make it PWA-ready.

ONBOARDING

Keep registration extremely simple.

The user only enters:

Name

Example:

Kingsley

Then:

Continue

Do NOT ask for:

Email

Password

Phone number

Address

Date of birth

Generate a unique user ID internally and use it to associate the user's data.

Remember the user on their device so they do not have to enter their name every time.

MAIN NAVIGATION

Create a mobile bottom navigation bar with five sections:

Home

Calendar

Tasks

Progress

Settings

Use clean icons and labels.

Make the navigation feel like a real mobile application.

HOME / DASHBOARD

The Home screen should be the main screen.

Show a time-based greeting:

Good morning, [Name]

Good afternoon, [Name]

Good evening, [Name]

Display today's date.

Example:

Wednesday, September 2

Then create a beautiful progress card:

TODAY'S PROGRESS

3 / 5 completed

60%

Use a clean circular or horizontal progress indicator.

Also show:

🔥 4 Day Streak

Then show:

TODAY'S TASKS

Each task should have:

Checkbox

Task name

Optional time

Priority indicator

Completion state

Example:

☐ Study Python

☐ Read LLM lesson

☑ Exercise

When the checkbox is clicked:

Mark the task completed

Animate the checkbox

Update the progress percentage

Update completed task count

Update the streak when applicable

Add a clear + Add Task button.

ADD TASK

Users must be able to create a task.

Fields:

Task

Required task name.

Date

Default to today but allow another date.

Time

Optional.

Priority

Low

Medium

High

Category

Optional.

Default categories can include:

Study

Work

Personal

Exercise

Project

Users should eventually be able to create their own categories.

Save button:

Add Task

After saving, update the interface immediately.

CALENDAR

Create a clean monthly calendar.

Users can:

Navigate between months

Select any date

See tasks belonging to that date

Add a task to the selected date

Show a small visual indicator on dates that contain tasks.

When a date is selected, display:

Tasks for [selected date]

Then show that day's tasks.

The calendar must work correctly across months and years.

TASKS SCREEN

Create a dedicated Tasks screen.

At the top:

Tasks

Add filters:

All

Today

Upcoming

Completed

Each task should allow:

Complete

Uncomplete

Edit

Delete

Change date

Keep the interface clean and mobile friendly.

PROGRESS SCREEN

Create a simple progress dashboard.

Show:

Today

Today's completion percentage.

This Week

Weekly completion percentage.

This Month

Monthly completion percentage.

Completed

Total completed tasks.

Missed

Total missed/uncompleted tasks.

Current Streak

Current consecutive-day streak.

Best Streak

Highest streak achieved.

Also create a simple weekly chart showing completion for each day of the week.

Do not create complicated analytics.

STREAK SYSTEM

Implement a simple streak system.

A day counts toward the user's streak when they complete at least one task on that day.

Track:

Current streak

Best streak

If the user has no qualifying completed task for a day, the current streak resets.

Make sure this works correctly across:

Different months

Different years

Leap years

DATABASE

Create the necessary Supabase tables.

users

id

name

created_at

updated_at

tasks

id

user_id

title

date

time

priority

category

completed

completed_at

created_at

updated_at

categories

id

user_id

name

created_at

Make sure user data is separated securely.

A user must never be able to access another user's tasks.

Use appropriate Supabase security policies/RLS.

SETTINGS

Keep Settings simple.

Include:

Profile

Change name.

Appearance

Light

Dark

System

Notifications

Simple notification/reminder preference.

Data

Export data

Delete all tasks

Delete account/data

Use confirmation dialogs before destructive actions.

About

Show:

Vin Tracker

Version number.

DESIGN SYSTEM

The UI should feel like a premium modern mobile application.

Use:

Blue/indigo primary color

White/light neutral background

Dark charcoal text

Muted gray secondary text

Green for completed/success states

Rounded cards

Subtle shadows

Clean icons

Excellent spacing

Modern typography

Smooth but subtle animations

Avoid:

Excessive gradients

Excessive colors

Huge cards

Clutter

Unnecessary animations

Generic dashboard layouts

The design should look intentional and professional.

MOBILE UX

Prioritize Android phones.

Make sure:

Buttons are easy to tap

Text is readable

Forms work correctly with the mobile keyboard

Bottom navigation stays accessible

Scrolling is smooth

Cards fit small screens

No content is cut off

The app works on different phone sizes

Also make it responsive for tablets and desktop.

EMPTY STATES

Create clean empty states.

If there are no tasks:

No tasks for today

Plan something and start making progress.

Button:

+ Add Task

If there is no progress yet:

Your progress will appear here once you complete your first task.

DATA PERSISTENCE

Tasks must remain saved after:

Closing the app

Refreshing the browser

Logging back in

Changing pages

Do not use temporary mock data for the actual application.

Use Supabase for persistent storage.

PWA / MOBILE APP PREPARATION

Configure the project to be PWA-ready.

Include:

Web app manifest

App name: Vin Tracker

Appropriate icons

Standalone display mode

Mobile theme metadata

Service worker/offline support where appropriate

Keep the architecture ready for later Android APK packaging.

IMPORTANT

Do not add:

Social media

Chat

Friends

Payments

Subscriptions

Advertising

AI assistant

Team collaboration

Complex project management

Unnecessary features

The product should remain focused on:

Calendar + Tasks + Dashboard + Progress + Streaks

Build the actual working application, not just a visual prototype.

Use real Supabase persistence and make all major interactions functional.

After building, test the complete flow:

Name → Home → Add Task → Calendar → Complete Task → Progress → Settings.

Fix any errors you encounter and make sure the application is responsive and polished.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/85e72d3d-db17-49c8-b612-b335da1b46b0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
