# Guestbook Configuration

This project includes a configurable guestbook feature that can be enabled or disabled through environment variables.

## Configuration

Add the following setting to your `.env` file:

```env
GUESTBOOK_PAGE=True
```

## Settings

- **`GUESTBOOK_PAGE=True`** (default): Enables the guestbook feature
  - Adds the guestbook app to `INSTALLED_APPS`
  - Adds all authentication-related apps (`allauth`, social providers)
  - Includes allauth middleware in the middleware stack
  - Includes guestbook and authentication URLs in the URL configuration
  - Shows guestbook navigation in the sidebar
  - Configures social account providers (Google, GitHub)
  - Sets up allauth settings for social authentication
  - Sets login/logout redirects to the guestbook page

- **`GUESTBOOK_PAGE=False`**: Disables the guestbook feature
  - Removes the guestbook app from `INSTALLED_APPS`
  - Removes all authentication-related apps (`allauth`, social providers)
  - Excludes allauth middleware from the middleware stack
  - Excludes guestbook and authentication URLs from routing
  - Hides guestbook navigation from the sidebar
  - Disables social account provider configurations
  - Removes allauth settings
  - Sets login/logout redirects to the home page

## Implementation Details

### Files Modified

1. **`FlexForge/settings.py`**
   - Added `GUESTBOOK_PAGE` setting with default value `True`
   - Conditionally includes `apps.guestbook` in `INSTALLED_APPS`
   - Conditionally includes all authentication apps (`allauth`, social providers)
   - Conditionally includes allauth middleware
   - Conditionally configures social account providers (Google, GitHub)
   - Conditionally sets up allauth configuration settings
   - Conditionally sets login/logout redirect URLs

2. **`FlexForge/urls.py`**
   - Conditionally includes guestbook URLs (which include authentication URLs)

3. **`FlexForge/context_processors.py`** (new file)
   - Makes `GUESTBOOK_PAGE` and `AUTHENTICATION_ENABLED` settings available in all templates

4. **`templates/sidebar.html`**
   - Conditionally displays guestbook navigation links
   - Conditionally includes guestbook in search results

5. **`.env.example`**
   - Added `GUESTBOOK_PAGE` setting with documentation

### Usage Examples

#### Enable Guestbook (Default)

```env
GUESTBOOK_PAGE=True
```

#### Disable Guestbook

```env
GUESTBOOK_PAGE=False
```

#### Not Set (Uses Default)

If `GUESTBOOK_PAGE` is not set in your `.env` file, it defaults to `True`.

## Migration Notes

- When disabling the guestbook (`GUESTBOOK_PAGE=False`), existing guestbook data will remain in the database but will not be accessible through the web interface
- Re-enabling the guestbook will restore full functionality without data loss
- Make sure to run migrations after enabling/disabling the feature: `python manage.py migrate`
- **Important**: When `GUESTBOOK_PAGE=False`, the following environment variables become optional and won't be used:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GH_CLIENT_ID`
  - `GH_CLIENT_SECRET`
- All authentication-related functionality is completely disabled when guestbook is off

## Development

When developing with this feature:

1. Set `GUESTBOOK_PAGE=True` in your development `.env` to test guestbook functionality
2. Set `GUESTBOOK_PAGE=False` to test the application without guestbook features
3. Ensure both configurations work correctly before deploying

## Production Deployment

For production deployments:

1. Set the appropriate value for `GUESTBOOK_PAGE` in your production environment variables
2. Restart your application server after changing this setting
3. The change will take effect immediately without requiring database migrations
