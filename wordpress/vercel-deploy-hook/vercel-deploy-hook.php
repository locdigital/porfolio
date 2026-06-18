<?php
/**
 * Plugin Name: Loc Digital Vercel Deploy Hook
 * Description: Triggers a Vercel deploy hook when WordPress posts are published or updated.
 * Version: 1.0.0
 * Author: Loc Digital
 */

if (!defined('ABSPATH')) {
    exit;
}

const LOC_DIGITAL_VERCEL_HOOK_OPTION = 'loc_digital_vercel_deploy_hook_url';
const LOC_DIGITAL_VERCEL_LAST_TRIGGER_OPTION = 'loc_digital_vercel_last_trigger';

add_action('admin_menu', function () {
    add_options_page(
        'Vercel Deploy Hook',
        'Vercel Deploy Hook',
        'manage_options',
        'loc-digital-vercel-deploy-hook',
        'loc_digital_vercel_deploy_hook_settings_page'
    );
});

add_action('admin_init', function () {
    register_setting(
        'loc_digital_vercel_deploy_hook_settings',
        LOC_DIGITAL_VERCEL_HOOK_OPTION,
        [
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => '',
        ]
    );
});

function loc_digital_vercel_deploy_hook_settings_page()
{
    if (!current_user_can('manage_options')) {
        return;
    }

    $last_trigger = get_option(LOC_DIGITAL_VERCEL_LAST_TRIGGER_OPTION, '');
    ?>
    <div class="wrap">
        <h1>Vercel Deploy Hook</h1>
        <form method="post" action="options.php">
            <?php settings_fields('loc_digital_vercel_deploy_hook_settings'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row">
                        <label for="<?php echo esc_attr(LOC_DIGITAL_VERCEL_HOOK_OPTION); ?>">Deploy Hook URL</label>
                    </th>
                    <td>
                        <input
                            name="<?php echo esc_attr(LOC_DIGITAL_VERCEL_HOOK_OPTION); ?>"
                            id="<?php echo esc_attr(LOC_DIGITAL_VERCEL_HOOK_OPTION); ?>"
                            type="url"
                            class="regular-text"
                            value="<?php echo esc_attr(get_option(LOC_DIGITAL_VERCEL_HOOK_OPTION, '')); ?>"
                            placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                        />
                        <p class="description">This URL is secret. Anyone with it can trigger a production deployment.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Save Hook URL'); ?>
        </form>

        <?php if ($last_trigger) : ?>
            <p><strong>Last trigger:</strong> <?php echo esc_html($last_trigger); ?></p>
        <?php endif; ?>
    </div>
    <?php
}

add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($post->post_type !== 'post') {
        return;
    }

    if ($new_status !== 'publish') {
        return;
    }

    if (wp_is_post_revision($post->ID) || wp_is_post_autosave($post->ID)) {
        return;
    }

    $hook_url = get_option(LOC_DIGITAL_VERCEL_HOOK_OPTION, '');
    if (!$hook_url) {
        return;
    }

    $response = wp_remote_post($hook_url, [
        'timeout' => 10,
        'blocking' => false,
        'headers' => [
            'Content-Type' => 'application/json',
        ],
        'body' => wp_json_encode([
            'source' => 'wordpress',
            'site' => home_url(),
            'post_id' => $post->ID,
            'post_slug' => $post->post_name,
            'new_status' => $new_status,
            'old_status' => $old_status,
        ]),
    ]);

    if (!is_wp_error($response)) {
        update_option(
            LOC_DIGITAL_VERCEL_LAST_TRIGGER_OPTION,
            current_time('mysql') . ' for post #' . $post->ID . ' (' . $post->post_name . ')'
        );
    }
}, 10, 3);
