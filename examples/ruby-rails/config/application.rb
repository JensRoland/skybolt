# frozen_string_literal: true

require_relative "boot"
require "rails"
require "action_controller/railtie"
require "action_view/railtie"

module SkyboltRailsExample
  class Application < Rails::Application
    config.load_defaults 7.1
    config.eager_load = false
    config.api_only = false
    config.secret_key_base = "skybolt-rails-example-secret-key-do-not-use-in-production"
  end
end
