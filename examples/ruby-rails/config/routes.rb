# frozen_string_literal: true

Rails.application.routes.draw do
  root "home#index"
  get "skybolt-sw.js", to: "service_worker#show"
end
