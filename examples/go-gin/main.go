package main

import (
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	skybolt "github.com/JensRoland/skybolt-go"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Set up custom template functions
	r.SetFuncMap(template.FuncMap{
		"safe": func(s string) template.HTML {
			return template.HTML(s)
		},
	})

	r.LoadHTMLGlob("templates/*")

	// Serve static files from the dist directory
	r.Static("/static/dist", "./static/dist")

	// Serve the service worker
	r.GET("/skybolt-sw.js", func(c *gin.Context) {
		swPath := filepath.Join("static", "dist", "skybolt-sw.js")
		if _, err := os.Stat(swPath); os.IsNotExist(err) {
			c.String(http.StatusNotFound, "Service Worker not found. Run 'npm run build' first.")
			return
		}
		c.Header("Service-Worker-Allowed", "/")
		c.Header("Cache-Control", "public, max-age=86400")
		c.File(swPath)
	})

	// Main route
	r.GET("/", func(c *gin.Context) {
		// Get cookies from request
		cookies := make(map[string]string)
		for _, cookie := range c.Request.Cookies() {
			cookies[cookie.Name] = cookie.Value
		}

		// Initialize Skybolt
		renderMapPath := filepath.Join("static", "dist", ".skybolt", "render-map.json")
		sb, err := skybolt.New(renderMapPath, cookies, "")
		if err != nil {
			// In development, render map might not exist yet
			if strings.Contains(err.Error(), "no such file") {
				c.String(http.StatusInternalServerError, "Render map not found. Run 'npm run build' first.")
				return
			}
			c.String(http.StatusInternalServerError, err.Error())
			return
		}

		c.HTML(http.StatusOK, "index.html", gin.H{
			"sb":      sb,
			"version": skybolt.Version,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
