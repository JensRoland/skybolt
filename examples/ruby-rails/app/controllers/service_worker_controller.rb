# frozen_string_literal: true

class ServiceWorkerController < ApplicationController
  skip_forgery_protection

  def show
    sw_path = Rails.root.join("public/dist/skybolt-sw.js")

    unless File.exist?(sw_path)
      render plain: "Service Worker not found. Run 'npm run build' first.", status: :not_found
      return
    end

    response.headers["Service-Worker-Allowed"] = "/"
    response.headers["Cache-Control"] = "public, max-age=86400"
    send_file sw_path, type: "application/javascript", disposition: "inline"
  end
end
