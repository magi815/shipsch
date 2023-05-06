from django.db import models

class MyModel(models.Model):
    Circuit = models.CharField(max_length=255, primary_key=True)
    SET_Block = models.TextField(max_length=255, db_column='SET Block')
    memo = models.CharField(max_length=100, null=True, blank=True)
    #memodate = models.DateTimeField(auto_now_add=False)
    memodate = models.CharField(max_length=100, null=True, blank=True)
    checked = models.IntegerField(default=0, null=True, blank=True)
    reverse = models.IntegerField(default=0, null=True, blank=True)
    list_node = models.CharField(max_length=100, null=True, blank=True)
    list_BlockPATH = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        abstract = True

class MyModelWithDynamicTable(MyModel):
    table_name = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.table_name is not None:
            self._meta.db_table = self.table_name

    class Meta:
        abstract = True


class MyMap(models.Model):
    title = models.CharField(max_length=255)
    ship = models.CharField(max_length=255)
    nodes = models.TextField()
    edges = models.TextField()
    nodepos = models.TextField()

    def __str__(self):
        return self.title