#!/usr/bin/env python3
"""
Test script for the new USN validation logic.
Tests both regular and lateral entry formats.
"""

import sys
import os

# Add the Django project to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'BackEnd'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CertifyTrack.settings')

import django
django.setup()

from api.models import validate_usn_format

def test_usn_validation():
    """Test the USN validation with various cases."""

    test_cases = [
        # Regular admission cases (001-399)
        ('2GI22CS001', 'CSE', True, 'regular', 'Regular student with 001'),
        ('2GI22CS050', 'CSE', True, 'regular', 'Regular student with 050'),
        ('2GI22CS399', 'CSE', True, 'regular', 'Regular student with 399'),

        # Lateral entry cases (400+)
        ('2GI22CS400', 'CSE', True, 'lateral', 'Lateral entry with 400'),
        ('2GI22CS450', 'CSE', True, 'lateral', 'Lateral entry with 450'),
        ('2GI22CS500', 'CSE', True, 'lateral', 'Lateral entry with 500'),

        # Department mismatch
        ('2GI22CS001', 'ECE', True, None, 'Branch code CS does not match department ECE'),

        # Invalid formats
        ('INVALID', 'CSE', False, None, 'Invalid format'),
        ('2GI22CSXYZ', 'CSE', False, None, 'Non-numeric suffix'),
    ]

    print("🧪 Testing USN Validation Logic")
    print("=" * 60)

    passed = 0
    total = len(test_cases)

    for usn, department, expected_valid, expected_type, description in test_cases:
        is_valid, error_msg, admission_type = validate_usn_format(usn, department)

        if is_valid == expected_valid:
            if expected_valid:
                if admission_type == expected_type:
                    print(f"✅ PASS: {description}")
                    print(f"   USN: {usn}, Department: {department} → {admission_type}")
                    passed += 1
                else:
                    print(f"❌ FAIL: {description}")
                    print(f"   Expected type: {expected_type}, Got: {admission_type}")
            else:
                print(f"✅ PASS: {description} (correctly rejected)")
                print(f"   Error: {error_msg}")
                passed += 1
        else:
            print(f"❌ FAIL: {description}")
            print(f"   Expected valid: {expected_valid}, Got: {is_valid}")

        print()

    print("=" * 60)
    print(f"📊 Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! USN validation logic is working correctly.")
        return True
    else:
        print("❌ Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = test_usn_validation()
    sys.exit(0 if success else 1)
