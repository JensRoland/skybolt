# frozen_string_literal: true

require "skybolt"

module SkyboltHelper
  def skybolt
    @skybolt ||= Skybolt::Renderer.new(
      Rails.root.join("public/dist/.skybolt/render-map.json").to_s,
      cookies: cookies.to_h.transform_keys(&:to_s)
    )
  end
end
