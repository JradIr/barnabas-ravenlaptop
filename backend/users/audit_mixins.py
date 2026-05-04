from .models import AuditLog

class AuditLogMixin:
    """Mixin to add audit logging to viewsets"""
    
    def log_admin_action(self, request, action, model_name, object_id=None, changes=None):
        # Only log if user is admin/staff
        is_admin_or_staff = (
            request.user.is_superuser or 
            request.user.is_staff or 
            getattr(request.user, 'role', '') == 'admin' or
            getattr(request.user, 'role', '') == 'staff'
        )
        
        if not is_admin_or_staff:
            return
        
        from .models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id else None,
            changes=changes or {},
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255]
        )
    
    def log_create(self, request, instance, model_name):
        changes = {'id': instance.id}
        for field in instance._meta.fields:
            value = getattr(instance, field.name)
            if value and field.name not in ['password', 'updated_at', 'created_at']:
                changes[field.name] = str(value) if value else None
        self.log_admin_action(request, 'create', model_name, instance.id, changes)
    
    def log_update(self, request, instance, old_data, model_name):
        changes = {}
        for field, old_value in old_data.items():
            new_value = getattr(instance, field)
            if str(old_value) != str(new_value):
                changes[field] = {'from': str(old_value), 'to': str(new_value)}
        if changes:
            self.log_admin_action(request, 'update', model_name, instance.id, changes)
    
    def log_delete(self, request, instance, model_name):
        changes = {'deleted_id': instance.id}
        self.log_admin_action(request, 'delete', model_name, instance.id, changes)