<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

The [splinter-ui repository](https://github.com/Cargill/splinter-ui) includes
the Admin UI for Splinter administration. One feature of the Splinter Admin UI 
is a profile page for the authenticated user. This document shows the new 
designs for the profile page.

## Profile

The **Profile** page shows the users profile photo, name and email supplied by 
the OAuth provider used for authentication. Additionally, a table of keys 
associated with the authenticated user is displayed.

![]({% link images/profile_adminapp.png %} "Profile")

### New Key

The **New Key** button redirects to the form for submitting a new signing key.
The new key can be entered manually or generated using the generate button.

![]({% link images/profile_adminapp_new_key.png %} "New Key")

### Key Actions

The ***Action*** button expands to show the available actions for the given key.

![]({% link images/profile_adminapp_key_actions_active.png %} "Key Actions
Active")

![]({% link images/profile_adminapp_key_actions_inactive.png %} "Key Actions
Inctive")
