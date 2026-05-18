package utils

import (
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/Shibaitle/DevOps-Final/configs"
	storage "github.com/supabase-community/storage-go"
	"gopkg.in/gomail.v2"
)

// NormalizeEmail lowercases and trims an email string.
func NormalizeEmail(email string) (string, error) {
	normalized := strings.TrimSpace(strings.ToLower(email))
	if normalized == "" {
		return "", errors.New("email is required")
	}
	if !strings.Contains(normalized, "@") {
		return "", errors.New("invalid email format")
	}
	return normalized, nil
}

// DetectFileType returns a safe file extension based on content type.
func DetectFileType(file multipart.File) (string, error) {
	if file == nil {
		return "", errors.New("file is required")
	}

	header := make([]byte, 512)
	n, err := file.Read(header)
	if err != nil && err != io.EOF {
		return "", err
	}

	if seeker, ok := file.(io.Seeker); ok {
		_, _ = seeker.Seek(0, io.SeekStart)
	}

	contentType := http.DetectContentType(header[:n])
	switch contentType {
	case "image/jpeg":
		return ".jpg", nil
	case "image/png":
		return ".png", nil
	case "image/gif":
		return ".gif", nil
	case "image/webp":
		return ".webp", nil
	case "application/pdf":
		return ".pdf", nil
	case "text/plain; charset=utf-8":
		return ".txt", nil
	default:
		_ = filepath.Ext(contentType)
		return ".bin", nil
	}
}

// UploadFile2Supa uploads a file to Supabase Storage. If Supabase is not configured,
// it returns an empty URL without failing the request.
func UploadFile2Supa(file multipart.File, fileName, folder string, supa configs.Supabase) (string, error) {
	if file == nil {
		return "", errors.New("file is required")
	}
	if supa.URL == "" || supa.ServiceKey == "" || supa.Bucket == "" {
		return "", nil
	}

	client := storage.NewClient(supa.URL, supa.ServiceKey, nil)
	path := fmt.Sprintf("%s%s", folder, fileName)

	_, err := client.UploadFile(supa.Bucket, path, file)
	if err != nil {
		return "", err
	}

	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supa.URL, supa.Bucket, path)
	return publicURL, nil
}

// GenerateRandomOTP creates a numeric OTP with the requested length.
func GenerateRandomOTP(length int) (string, error) {
	if length <= 0 {
		return "", errors.New("length must be positive")
	}
	max := byte(10)
	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	for i := range buf {
		buf[i] = '0' + (buf[i] % max)
	}
	return string(buf), nil
}

// SendMail sends a templated email. If mail config is missing, it returns nil.
func SendMail(templatePath string, user interface{}, otpCode string, mail configs.Mail) error {
	if mail.Host == "" || mail.Port == "" || mail.Sender == "" || mail.Key == "" {
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", mail.Sender)
	m.SetHeader("To", mail.Sender)
	m.SetHeader("Subject", "Password Reset")
	m.SetBody("text/plain", fmt.Sprintf("OTP: %s", otpCode))

	port, err := parsePort(mail.Port)
	if err != nil {
		return err
	}
	d := gomail.NewDialer(mail.Host, port, mail.Sender, mail.Key)
	return d.DialAndSend(m)
}

func parsePort(raw string) (int, error) {
	port := strings.TrimSpace(raw)
	if port == "" {
		return 0, errors.New("mail port is required")
	}
	var value int
	_, err := fmt.Sscanf(port, "%d", &value)
	if err != nil {
		return 0, err
	}
	return value, nil
}
