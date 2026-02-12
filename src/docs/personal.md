---
title: For You
group: Use Cases
order: 7
---

# For You

New Mac, unboxed to coding in 5 minutes. Here's the typical flow for individual developers.

## New Mac: Start from Scratch

Open Terminal, one command:

```
curl -fsSL https://openboot.dev/install.sh | bash
```

The TUI pops up — pick the packages you want, hit Enter to confirm. After installation, restart your terminal and start coding.

If you already know what you need, use a preset to skip the picker:

```
curl -fsSL https://openboot.dev/install.sh | bash -s -- --preset developer
```

See [Presets](/docs/presets) for what's in each. Not sure which one? Go with `developer`.

## Existing Mac: Save Your Setup

You've been using your Mac for a while — tools installed, configs tuned just right. Don't want to redo all that next time you switch machines? Snapshot it:

```
openboot snapshot
```

It scans your Homebrew packages, macOS preferences, shell config, and git settings. You review everything in the TUI, deselect anything you don't want to share, then upload.

After uploading, you get a link:

```
curl -fsSL https://openboot.dev/yourname/my-setup/install.sh | bash
```

Next time you switch machines, run that one command. You can also save locally without uploading:

```
openboot snapshot --local
```

## Customize Your Environment

Presets not enough? Build your own config on the [Dashboard](/dashboard):

1. Pick a preset as your base
2. Search and add the packages you need
3. Set a dotfiles repo (if you have one)
4. Add a custom script (e.g. clone your commonly used repos)
5. Save and get your personal install URL

Next time you reinstall or switch machines, one command restores everything.

## Day-to-Day Maintenance

```
openboot doctor        # check environment health
openboot update        # update all Homebrew packages
openboot update --self # update OpenBoot itself
```

## Typical Flow

```
New Mac → curl one-liner → TUI picks → start working
                ↓
         use it for a while
                ↓
     openboot snapshot → save your setup
                ↓
         next machine
                ↓
     curl your snapshot URL → everything restored
```
